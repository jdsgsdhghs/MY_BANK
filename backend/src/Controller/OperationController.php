<?php

namespace App\Controller;

use App\Entity\Category;
use App\Entity\Operation;
use App\Entity\User;
use App\Repository\OperationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/operations')]
class OperationController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly OperationRepository $repo,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
    ) {
    }

    #[Route('', name: 'api_operations_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        return $this->jsonResponse($this->repo->findByOwner($user));
    }

    #[Route('', name: 'api_operations_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        $operation = new Operation();
        $operation->setOwner($user);
        if ($error = $this->fill($operation, $data)) {
            return $error;
        }

        if ($error = $this->validate($operation)) {
            return $error;
        }

        $this->em->persist($operation);
        $this->em->flush();

        return $this->jsonResponse($operation, 201);
    }

    #[Route('/{id}', name: 'api_operations_get', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function get(int $id): JsonResponse
    {
        $operation = $this->findOwned($id);
        if (!$operation) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        return $this->jsonResponse($operation);
    }

    #[Route('/{id}', name: 'api_operations_update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $operation = $this->findOwned($id);
        if (!$operation) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        $data = json_decode($request->getContent(), true) ?? [];
        if ($error = $this->fill($operation, $data)) {
            return $error;
        }
        if ($error = $this->validate($operation)) {
            return $error;
        }
        $this->em->flush();
        return $this->jsonResponse($operation);
    }

    #[Route('/{id}', name: 'api_operations_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $operation = $this->findOwned($id);
        if (!$operation) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        $this->em->remove($operation);
        $this->em->flush();
        return new JsonResponse(null, 204);
    }

    private function fill(Operation $operation, array $data): ?JsonResponse
    {
        if (array_key_exists('label', $data)) {
            $operation->setLabel(trim((string) $data['label']));
        }
        if (array_key_exists('amount', $data)) {
            $operation->setAmount((string) $data['amount']);
        }
        if (array_key_exists('date', $data)) {
            try {
                $operation->setDate(new \DateTimeImmutable((string) $data['date']));
            } catch (\Exception) {
                return new JsonResponse(['error' => 'Invalid date format (expected YYYY-MM-DD)'], 400);
            }
        }
        if (array_key_exists('categoryId', $data)) {
            $cat = null;
            if ($data['categoryId'] !== null) {
                /** @var User $user */
                $user = $this->getUser();
                $cat = $this->em->getRepository(Category::class)->find((int) $data['categoryId']);
                if (!$cat || $cat->getOwner() !== $user) {
                    return new JsonResponse(['error' => 'Category not found'], 400);
                }
            }
            $operation->setCategory($cat);
        }
        return null;
    }

    private function findOwned(int $id): ?Operation
    {
        /** @var User $user */
        $user = $this->getUser();
        $op = $this->repo->find($id);
        if (!$op || $op->getOwner() !== $user) {
            return null;
        }
        return $op;
    }

    private function validate(Operation $operation): ?JsonResponse
    {
        $errors = $this->validator->validate($operation);
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
        $json = $this->serializer->serialize($data, 'json', ['groups' => ['operation:read']]);
        return new JsonResponse($json, $status, [], true);
    }
}
