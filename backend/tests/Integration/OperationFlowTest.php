<?php

namespace App\Tests\Integration;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class OperationFlowTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->em = $container->get(EntityManagerInterface::class);

        $this->resetDatabase();
        $this->createUser('test@mybank.local', 'password123');
    }

    public function testFullCrudFlow(): void
    {
        $token = $this->login('test@mybank.local', 'password123');
        $this->assertNotEmpty($token);

        $headers = ['HTTP_AUTHORIZATION' => 'Bearer '.$token, 'CONTENT_TYPE' => 'application/json'];

        // Create category
        $this->client->request('POST', '/api/categories', [], [], $headers, json_encode(['title' => 'Food']));
        $this->assertResponseStatusCodeSame(201);
        $category = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Food', $category['title']);

        // Create operation
        $payload = ['label' => 'Lunch', 'amount' => '12.50', 'date' => '2025-01-15', 'categoryId' => $category['id']];
        $this->client->request('POST', '/api/operations', [], [], $headers, json_encode($payload));
        $this->assertResponseStatusCodeSame(201);
        $operation = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Lunch', $operation['label']);

        // List operations
        $this->client->request('GET', '/api/operations', [], [], $headers);
        $this->assertResponseIsSuccessful();
        $list = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertCount(1, $list);

        // Update operation
        $this->client->request('PUT', '/api/operations/'.$operation['id'], [], [], $headers, json_encode(['label' => 'Brunch']));
        $this->assertResponseIsSuccessful();
        $updated = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Brunch', $updated['label']);

        // Delete
        $this->client->request('DELETE', '/api/operations/'.$operation['id'], [], [], $headers);
        $this->assertResponseStatusCodeSame(204);
    }

    public function testUnauthenticatedAccessIsRejected(): void
    {
        $this->client->request('GET', '/api/operations');
        $this->assertResponseStatusCodeSame(401);
    }

    private function createUser(string $email, string $password): void
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $user = new User();
        $user->setEmail($email);
        $user->setPassword($hasher->hashPassword($user, $password));
        $this->em->persist($user);
        $this->em->flush();
    }

    private function login(string $email, string $password): string
    {
        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => $email, 'password' => $password])
        );
        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        return $data['token'];
    }

    private function resetDatabase(): void
    {
        $schemaTool = new \Doctrine\ORM\Tools\SchemaTool($this->em);
        $metadata = $this->em->getMetadataFactory()->getAllMetadata();
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }
}
