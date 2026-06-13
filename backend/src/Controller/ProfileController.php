<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/profile')]
class ProfileController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $repo,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly JWTTokenManagerInterface $jwtManager,
    ) {
    }

    #[Route('', name: 'api_profile_show', methods: ['GET'])]
    public function show(): JsonResponse
    {
        return $this->jsonResponse($this->currentUser());
    }

    #[Route('', name: 'api_profile_update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request): JsonResponse
    {
        $user = $this->currentUser();
        $data = json_decode($request->getContent(), true) ?? [];

        $wantsEmailChange = isset($data['email']) && trim((string) $data['email']) !== $user->getEmail();
        $wantsPasswordChange = !empty($data['password']);

        if (!$wantsEmailChange && !$wantsPasswordChange) {
            return new JsonResponse(['error' => 'Nothing to update'], 400);
        }

        // Any sensitive change requires confirming the current password.
        $currentPassword = (string) ($data['currentPassword'] ?? '');
        if ($currentPassword === '' || !$this->hasher->isPasswordValid($user, $currentPassword)) {
            return new JsonResponse(['error' => 'Current password is incorrect'], 403);
        }

        if ($wantsEmailChange) {
            $newEmail = trim((string) $data['email']);
            $existing = $this->repo->findOneBy(['email' => $newEmail]);
            if ($existing && $existing->getId() !== $user->getId()) {
                return new JsonResponse(['error' => 'Email already in use'], 409);
            }
            $user->setEmail($newEmail);
        }

        if ($wantsPasswordChange) {
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

        // Email and roles are embedded in the JWT, so hand back a fresh token
        // to keep the client's identity in sync after the change.
        $json = $this->serializer->serialize($user, 'json', ['groups' => ['user:read']]);
        $payload = json_decode($json, true);
        $payload['token'] = $this->jwtManager->create($user);

        return new JsonResponse($payload);
    }

    private function currentUser(): User
    {
        /** @var User $user */
        $user = $this->getUser();

        return $user;
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
