<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class RegistrationController
{
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher,
        ValidatorInterface $validator,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        if ($email === '' || $password === '') {
            return new JsonResponse(['error' => 'Email and password are required'], 400);
        }
        if (strlen($password) < 8) {
            return new JsonResponse(['error' => 'Password must be at least 8 characters'], 400);
        }

        if ($em->getRepository(User::class)->findOneBy(['email' => $email])) {
            return new JsonResponse(['error' => 'Email already in use'], 409);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setPassword($hasher->hashPassword($user, $password));

        $errors = $validator->validate($user);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }
            return new JsonResponse(['error' => 'Validation failed', 'details' => $messages], 400);
        }

        $em->persist($user);
        $em->flush();

        return new JsonResponse(
            ['id' => $user->getId(), 'email' => $user->getEmail()],
            201
        );
    }
}
