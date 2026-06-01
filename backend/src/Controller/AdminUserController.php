<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/admin/users')]
#[IsGranted('ROLE_ADMIN')]
class AdminUserController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $repo,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
    ) {
    }

    #[Route('', name: 'api_admin_users_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $users = $this->repo->findBy([], ['id' => 'ASC']);
        return $this->jsonResponse($users);
    }

    #[Route('', name: 'api_admin_users_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $roles = $this->normalizeRoles($data['roles'] ?? []);

        if ($email === '' || $password === '') {
            return new JsonResponse(['error' => 'Email and password are required'], 400);
        }
        if (strlen($password) < 8) {
            return new JsonResponse(['error' => 'Password must be at least 8 characters'], 400);
        }
        if ($this->repo->findOneBy(['email' => $email])) {
            return new JsonResponse(['error' => 'Email already in use'], 409);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setPassword($this->hasher->hashPassword($user, $password));
        $user->setRoles($roles);

        if ($error = $this->validate($user)) {
            return $error;
        }

        $this->em->persist($user);
        $this->em->flush();

        return $this->jsonResponse($user, 201);
    }

    #[Route('/{id}', name: 'api_admin_users_update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->repo->find($id);
        if (!$user) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        $data = json_decode($request->getContent(), true) ?? [];

        if (isset($data['email'])) {
            $newEmail = trim((string) $data['email']);
            if ($newEmail !== $user->getEmail()) {
                $existing = $this->repo->findOneBy(['email' => $newEmail]);
                if ($existing && $existing->getId() !== $user->getId()) {
                    return new JsonResponse(['error' => 'Email already in use'], 409);
                }
                $user->setEmail($newEmail);
            }
        }

        if (array_key_exists('roles', $data)) {
            $user->setRoles($this->normalizeRoles($data['roles']));
        }

        if (!empty($data['password'])) {
            $password = (string) $data['password'];
            if (strlen($password) < 8) {
                return new JsonResponse(['error' => 'Password must be at least 8 characters'], 400);
            }
            $user->setPassword($this->hasher->hashPassword($user, $password));
        }

        if ($error = $this->validate($user)) {
            return $error;
        }

        $this->em->flush();
        return $this->jsonResponse($user);
    }

    #[Route('/{id}', name: 'api_admin_users_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->repo->find($id);
        if (!$user) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        if ($user === $this->getUser()) {
            return new JsonResponse(['error' => 'You cannot delete your own account'], 400);
        }

        $this->em->remove($user);
        $this->em->flush();
        return new JsonResponse(null, 204);
    }

    private function normalizeRoles(mixed $roles): array
    {
        if (!is_array($roles)) {
            return [];
        }
        $allowed = ['ROLE_USER', 'ROLE_ADMIN'];
        $result = [];
        foreach ($roles as $role) {
            $role = is_string($role) ? strtoupper(trim($role)) : '';
            if (in_array($role, $allowed, true)) {
                $result[] = $role;
            }
        }
        return array_values(array_unique($result));
    }

    private function validate(User $user): ?JsonResponse
    {
        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }
            return new JsonResponse(['error' => 'Validation failed', 'details' => $messages], 400);
        }
        return null;
    }

    private function jsonResponse(mixed $data, int $status = 200): JsonResponse
    {
        $json = $this->serializer->serialize($data, 'json', ['groups' => ['user:read']]);
        return new JsonResponse($json, $status, [], true);
    }
}
