#include "FLRealisticCityBlock.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "UObject/ConstructorHelpers.h"

AFLRealisticCityBlock::AFLRealisticCityBlock()
{
    PrimaryActorTick.bCanEverTick = false;
    SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
    RootComponent = SceneRoot;

    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cylinder(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Sphere(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    if (Cube.Succeeded()) CubeMesh = Cube.Object;
    if (Cylinder.Succeeded()) CylinderMesh = Cylinder.Object;
    if (Sphere.Succeeded()) SphereMesh = Sphere.Object;
}

void AFLRealisticCityBlock::BeginPlay()
{
    Super::BeginPlay();
    BuildDistrict();
}

void AFLRealisticCityBlock::AddBox(const FVector& Location, const FVector& Scale)
{
    if (!CubeMesh) return;
    UStaticMeshComponent* Part = NewObject<UStaticMeshComponent>(this);
    Part->SetStaticMesh(CubeMesh);
    Part->SetRelativeLocation(Location);
    Part->SetRelativeScale3D(Scale);
    Part->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
    Part->SetMobility(EComponentMobility::Movable);
    Part->SetupAttachment(SceneRoot);
    Part->RegisterComponent();
}

void AFLRealisticCityBlock::AddTree(const FVector& Location, float Height)
{
    if (!CylinderMesh || !SphereMesh) return;

    UStaticMeshComponent* Trunk = NewObject<UStaticMeshComponent>(this);
    Trunk->SetStaticMesh(CylinderMesh);
    Trunk->SetRelativeLocation(Location + FVector(0, 0, Height * 0.30f));
    Trunk->SetRelativeScale3D(FVector(0.16f, 0.16f, Height * 0.30f));
    Trunk->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
    Trunk->SetMobility(EComponentMobility::Movable);
    Trunk->SetupAttachment(SceneRoot);
    Trunk->RegisterComponent();

    UStaticMeshComponent* Crown = NewObject<UStaticMeshComponent>(this);
    Crown->SetStaticMesh(SphereMesh);
    Crown->SetRelativeLocation(Location + FVector(0, 0, Height * 0.78f));
    Crown->SetRelativeScale3D(FVector(0.85f, 0.85f, 1.05f));
    Crown->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    Crown->SetMobility(EComponentMobility::Movable);
    Crown->SetupAttachment(SceneRoot);
    Crown->RegisterComponent();
}

void AFLRealisticCityBlock::BuildDistrict()
{
    // Temporary primitive-mesh greybox. Replace with authored PBR assets in the art pass.
    AddBox(FVector(0, 0, -35), FVector(42, 42, 0.35f));

    for (int32 I = -1; I <= 1; ++I)
    {
        const float X = I * 2600.0f;
        const float Y = I * 2600.0f;
        AddBox(FVector(X, 0, -12), FVector(4.5f, 42, 0.12f));
        AddBox(FVector(0, Y, -12), FVector(42, 4.5f, 0.12f));
        AddBox(FVector(X + 570, 0, 8), FVector(1.2f, 42, 0.08f));
        AddBox(FVector(X - 570, 0, 8), FVector(1.2f, 42, 0.08f));
        AddBox(FVector(0, Y + 570, 8), FVector(42, 1.2f, 0.08f));
        AddBox(FVector(0, Y - 570, 8), FVector(42, 1.2f, 0.08f));
    }

    for (int32 X = -1; X <= 1; ++X)
    {
        for (int32 Y = -1; Y <= 1; ++Y)
        {
            const FVector Center(X * 2600.0f + 1300.0f, Y * 2600.0f + 1300.0f, 0);
            const float HeightA = 650.0f + ((X + Y + 4) % 3) * 260.0f;
            AddBox(Center + FVector(-420, -380, HeightA * 0.5f), FVector(5.2f, 4.2f, HeightA * 0.005f));
            AddBox(Center + FVector(380, 260, HeightA * 0.38f), FVector(4.0f, 5.0f, HeightA * 0.0038f));
            AddBox(Center + FVector(-350, 430, 55), FVector(5.6f, 0.25f, 0.55f));
            AddTree(Center + FVector(650, -520, 0), 520.0f);
            AddTree(Center + FVector(-650, 520, 0), 610.0f);
        }
    }
}