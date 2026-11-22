#include "FLVehicleShowcaseActor.h"
#include "FLRealisticCharacter.h"
#include "Components/BoxComponent.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/FloatingPawnMovement.h"
#include "GameFramework/PlayerController.h"
#include "Components/InputComponent.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

AFLVehicleShowcaseActor::AFLVehicleShowcaseActor()
{
    PrimaryActorTick.bCanEverTick = true;
    CollisionRoot = CreateDefaultSubobject<UBoxComponent>(TEXT("VehicleCollision"));
    RootComponent = CollisionRoot;
    CollisionRoot->SetBoxExtent(FVector(230.0f, 105.0f, 85.0f));
    CollisionRoot->SetCollisionProfileName(TEXT("Pawn"));
    CollisionRoot->SetSimulatePhysics(false);
    SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("VisualRoot"));
    SceneRoot->SetupAttachment(CollisionRoot);
    SceneRoot->SetRelativeLocation(FVector(0.0f, 0.0f, -85.0f));
    DriverCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("DriverCamera"));
    DriverCamera->SetupAttachment(SceneRoot);
    DriverCamera->SetRelativeLocation(FVector(35.0f, 0.0f, 235.0f));
    DriverCamera->bUsePawnControlRotation = true;
    VehicleMovement = CreateDefaultSubobject<UFloatingPawnMovement>(TEXT("VehicleMovement"));
    VehicleMovement->SetUpdatedComponent(CollisionRoot);
    VehicleMovement->MaxSpeed = 2400.0f;
    VehicleMovement->Acceleration = 1800.0f;
    VehicleMovement->Deceleration = 2200.0f;
    AutoPossessAI = EAutoPossessAI::Disabled;
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cylinder(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    if (Cube.Succeeded()) CubeMesh = Cube.Object;
    if (Cylinder.Succeeded()) CylinderMesh = Cylinder.Object;
}
void AFLVehicleShowcaseActor::BeginPlay()
{
    Super::BeginPlay();
    FuelPercent = 100.0f;
    if (VehicleStyle == 1) BuildVan();
    else if (VehicleStyle == 2) BuildPoliceCar();
    else BuildSedan();
}
void AFLVehicleShowcaseActor::AddPart(UStaticMesh* Mesh, const FVector& Location, const FVector& Scale, const FLinearColor& Tint, const FRotator& Rotation)
{
    if (!Mesh) return;
    UStaticMeshComponent* Part = NewObject<UStaticMeshComponent>(this);
    Part->SetStaticMesh(Mesh);
    Part->SetupAttachment(SceneRoot);
    Part->SetRelativeLocation(Location);
    Part->SetRelativeRotation(Rotation);
    Part->SetRelativeScale3D(Scale);
    if (UMaterialInterface* BaseMaterial = Part->GetMaterial(0))
    {
        if (UMaterialInstanceDynamic* DynamicMaterial = UMaterialInstanceDynamic::Create(BaseMaterial, this))
        {
            DynamicMaterial->SetVectorParameterValue(TEXT("Color"), Tint);
            DynamicMaterial->SetVectorParameterValue(TEXT("BaseColor"), Tint);
            Part->SetMaterial(0, DynamicMaterial);
        }
    }
    Part->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    Part->SetMobility(EComponentMobility::Movable);
    Part->RegisterComponent();
}
void AFLVehicleShowcaseActor::BuildSedan()
{
    AddPart(CubeMesh, FVector(0,0,72), FVector(2.25f,0.92f,0.42f), FLinearColor(0.035f,0.12f,0.22f,1.0f));
    AddPart(CubeMesh, FVector(-12,0,132), FVector(1.12f,0.78f,0.34f), FLinearColor(0.045f,0.16f,0.22f,1.0f));
    AddPart(CubeMesh, FVector(0,0,98), FVector(1.05f,0.82f,0.025f), FLinearColor(0.28f,0.31f,0.34f,1.0f));
    AddPart(CubeMesh, FVector(105,0,78), FVector(0.16f,0.94f,0.18f), FLinearColor(0.28f,0.31f,0.34f,1.0f));
    AddPart(CubeMesh, FVector(-105,0,78), FVector(0.16f,0.94f,0.18f), FLinearColor(0.28f,0.31f,0.34f,1.0f));
    for (int32 X : {-145,145})
        for (int32 Y : {-88,88})
            AddPart(CylinderMesh, FVector(X,Y,42), FVector(0.40f,0.16f,0.40f), FLinearColor(0.018f,0.022f,0.028f,1.0f), FRotator(90,0,0));
    AddPart(CubeMesh, FVector(218,-48,80), FVector(0.08f,0.20f,0.12f), FLinearColor(0.92f,0.82f,0.58f,1.0f));
    AddPart(CubeMesh, FVector(218,48,80), FVector(0.08f,0.20f,0.12f), FLinearColor(0.92f,0.82f,0.58f,1.0f));
    // Side glazing, front/rear glass, grille, mirrors and wheel hubs.
    const FLinearColor Glass(0.025f,0.075f,0.095f,1.0f);
    const FLinearColor Metal(0.34f,0.37f,0.39f,1.0f);
    AddPart(CubeMesh, FVector(-18,-82,139), FVector(0.78f,0.025f,0.20f), Glass);
    AddPart(CubeMesh, FVector(-18,82,139), FVector(0.78f,0.025f,0.20f), Glass);
    AddPart(CubeMesh, FVector(92,-82,126), FVector(0.34f,0.025f,0.16f), Glass);
    AddPart(CubeMesh, FVector(92,82,126), FVector(0.34f,0.025f,0.16f), Glass);
    AddPart(CubeMesh, FVector(85,0,129), FVector(0.035f,0.64f,0.22f), Glass, FRotator(0,0,-10));
    AddPart(CubeMesh, FVector(-108,0,129), FVector(0.035f,0.64f,0.22f), Glass, FRotator(0,0,10));
    AddPart(CubeMesh, FVector(226,0,64), FVector(0.035f,0.42f,0.12f), Metal);
    AddPart(CubeMesh, FVector(-225,0,64), FVector(0.035f,0.42f,0.12f), Metal);
    AddPart(CubeMesh, FVector(20,-102,118), FVector(0.16f,0.12f,0.08f), Metal);
    AddPart(CubeMesh, FVector(20,102,118), FVector(0.16f,0.12f,0.08f), Metal);
    for (int32 X : {-145,145})
        for (int32 Y : {-105,105})
            AddPart(CylinderMesh, FVector(X,Y,42), FVector(0.19f,0.08f,0.19f), Metal, FRotator(90,0,0));
}
void AFLVehicleShowcaseActor::BuildVan()
{
    AddPart(CubeMesh, FVector(0,0,105), FVector(2.35f,0.98f,0.82f), FLinearColor(0.68f,0.70f,0.72f,1.0f));
    AddPart(CubeMesh, FVector(-40,0,188), FVector(1.45f,0.91f,0.18f), FLinearColor(0.045f,0.16f,0.22f,1.0f));
    AddPart(CubeMesh, FVector(0,0,25), FVector(2.15f,0.92f,0.12f), FLinearColor(0.28f,0.31f,0.34f,1.0f));
    for (int32 X : {-150,150})
        for (int32 Y : {-92,92})
            AddPart(CylinderMesh, FVector(X,Y,48), FVector(0.42f,0.17f,0.42f), FLinearColor(0.018f,0.022f,0.028f,1.0f), FRotator(90,0,0));
    AddPart(CubeMesh, FVector(230,-50,120), FVector(0.07f,0.18f,0.13f), FLinearColor(0.92f,0.82f,0.58f,1.0f));
    AddPart(CubeMesh, FVector(230,50,120), FVector(0.07f,0.18f,0.13f), FLinearColor(0.92f,0.82f,0.58f,1.0f));
    const FLinearColor VanGlass(0.025f,0.075f,0.095f,1.0f);
    AddPart(CubeMesh, FVector(205,0,155), FVector(0.035f,0.62f,0.24f), VanGlass, FRotator(0,0,-8));
    AddPart(CubeMesh, FVector(-20,-99,155), FVector(0.82f,0.025f,0.28f), VanGlass);
    AddPart(CubeMesh, FVector(-20,99,155), FVector(0.82f,0.025f,0.28f), VanGlass);
    AddPart(CubeMesh, FVector(225,0,70), FVector(0.035f,0.48f,0.13f), FLinearColor(0.30f,0.32f,0.34f,1.0f));
}
void AFLVehicleShowcaseActor::BuildPoliceCar()
{
    BuildSedan();
    AddPart(CubeMesh, FVector(-8,0,171), FVector(0.48f,0.18f,0.07f), FLinearColor(0.72f,0.76f,0.78f,1.0f));
    AddPart(CubeMesh, FVector(-8,-25,183), FVector(0.12f,0.12f,0.08f), FLinearColor(0.025f,0.08f,0.55f,1.0f));
    AddPart(CubeMesh, FVector(-8,25,183), FVector(0.12f,0.12f,0.08f), FLinearColor(0.7f,0.015f,0.02f,1.0f));
}

void AFLVehicleShowcaseActor::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);
    PlayerInputComponent->BindAxis("MoveForward", this, &AFLVehicleShowcaseActor::DriveForward);
    PlayerInputComponent->BindAxis("MoveRight", this, &AFLVehicleShowcaseActor::Steer);
    PlayerInputComponent->BindAxis("Turn", this, &APawn::AddControllerYawInput);
    PlayerInputComponent->BindAction("Interact", IE_Pressed, this, &AFLVehicleShowcaseActor::ExitVehicle);
}

void AFLVehicleShowcaseActor::DriveForward(float Value)
{
    CurrentThrottle = FMath::Clamp(Value, -1.0f, 1.0f);
    if (FuelPercent > 0.0f && FMath::Abs(Value) > KINDA_SMALL_NUMBER)
        AddMovementInput(GetActorForwardVector(), Value);
}

void AFLVehicleShowcaseActor::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (GetController() && FuelPercent > 0.0f && FMath::Abs(CurrentThrottle) > 0.05f)
    {
        const float LitresUsed = (LitresPerHourAtFullThrottle * FMath::Abs(CurrentThrottle) * DeltaSeconds) / 3600.0f;
        FuelPercent = FMath::Max(0.0f, FuelPercent - (LitresUsed / FMath::Max(1.0f, FuelCapacityLitres)) * 100.0f);
    }
    if (FuelPercent <= 0.0f)
    {
        CurrentThrottle = 0.0f;
        VehicleMovement->StopMovementImmediately();
    }
}

void AFLVehicleShowcaseActor::Steer(float Value)
{
    if (Controller && FMath::Abs(Value) > KINDA_SMALL_NUMBER)
        AddControllerYawInput(Value * 1.8f);
}

void AFLVehicleShowcaseActor::EnterVehicle(AFLRealisticCharacter* Character)
{
    if (!Character || !Character->GetController()) return;
    PreviousDriver = Character;
    Character->GetController()->Possess(this);
}

void AFLVehicleShowcaseActor::ExitVehicle()
{
    APlayerController* PC = Cast<APlayerController>(GetController());
    if (!PC || !PreviousDriver) return;
    CurrentThrottle = 0.0f;
    AFLRealisticCharacter* Character = PreviousDriver;
    PreviousDriver = nullptr;
    Character->SetActorLocation(GetActorLocation() - GetActorRightVector() * 280.0f + FVector(0,0,20.0f));
    PC->Possess(Character);
}
