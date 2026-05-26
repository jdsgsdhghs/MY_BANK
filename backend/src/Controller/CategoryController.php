<?php

namespace App\Controller;

use App\Entity\Category;
use App\Entity\User;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/categories')]
class CategoryController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly CategoryRepository $repo,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
    ) {
    }

    #[Route('', name: 'api_categories_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $items = $this->repo->findByOwner($user);
        return $this->jsonResponse($items);
    }

    #[Route('', name: 'api_categories_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        $category = new Category();
        $category->setTitle(trim((string) ($data['title'] ?? '')));
        $category->setOwner($user);

        if ($error = $this->validate($category)) {
            return $error;
        }

        $this->em->persist($category);
        $this->em->flush();

        return $this->jsonResponse($category, 201);
    }

    #[Route('/{id}', name: 'api_categories_update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $category = $this->findOwned($id);
        if (!$category) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        $data = json_decode($request->getContent(), true) ?? [];
        if (isset($data['title'])) {
            $category->setTitle(trim((string) $data['title']));
        }

        if ($error = $this->validate($category)) {
            return $error;
        }

        $this->em->flush();
        return $this->jsonResponse($category);
    }

    #[Route('/{id}', name: 'api_categories_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $category = $this->findOwned($id);
        if (!$category) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        $this->em->remove($category);
        $this->em->flush();
        return new JsonResponse(null, 204);
    }

    private function findOwned(int $id): ?Category
    {
        /** @var User $user */
        $user = $this->getUser();
        $category = $this->repo->find($id);
        if (!$category || $category->getOwner() !== $user) {
            return null;
        }
        return $category;
    }

    private function validate(Category $category): ?JsonResponse
    {
        $errors = $this->validator->validate($category);
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
        $json = $this->serializer->serialize($data, 'json', ['groups' => ['category:read']]);
        return new JsonResponse($json, $status, [], true);
    }
}
