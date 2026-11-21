#include "FLRealisticWeatherManager.h"
#include "Components/InstancedStaticMeshComponent.h"
#include "Components/PostProcessComponent.h"
#include "Camera/PlayerCameraManager.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "UObject/ConstructorHelpers.h"

AFLRealisticWeatherManager::AFLRealisticWeatherManager()
{
    PrimaryActorTick.bCanEverTick = true;
    RootComponent = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));

    RainInstances = CreateDefaultSubobject<UInstancedStaticMeshComponent>(TEXT("RainStreaks"));
    RainInstances->SetupAttachment(RootComponent);
    RainInstances->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    RainInstances->SetCastShadow(false);
    RainInstances->SetMobility(EComponentMobility::Movable);

    WeatherPostProcess = CreateDefaultSubobject<UPostProcessComponent>(TEXT("WeatherPostProcess"));
    WeatherPostProcess->SetupAttachment(RootComponent);
    WeatherPostProcess->bUnbound = true;
    WeatherPostProcess->Priority = 5.0f;
    WeatherPostProcess->Settings.bOverride_ScreenSpaceReflectionIntensity = true;
    WeatherPostProcess->Settings.ScreenSpaceReflectionIntensity = 1.25f;
    WeatherPostProcess->Settings.bOverride_ScreenSpaceReflectionQuality = true;
    WeatherPostProcess->Settings.ScreenSpaceReflectionQuality = 100.0f;

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CylinderAsset(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    if (CylinderAsset.Succeeded())
    {
        RainMesh = CylinderAsset.Object;
        RainInstances->SetStaticMesh(RainMesh);
    }
}

void AFLRealisticWeatherManager::BeginPlay()
{
    Super::BeginPlay();
    if (!RainMesh || !RainInstances) return;

    const int32 Count = FMath::Clamp(RainDropCount, 20, 500);
    DropPositions.Reserve(Count);
    for (int32 Index = 0; Index < Count; ++Index)
    {
        const FVector Position(
            FMath::FRandRange(-RainRadius, RainRadius),
            FMath::FRandRange(-RainRadius, RainRadius),
            FMath::FRandRange(500.0f, 3200.0f));
        DropPositions.Add(Position);
        const FTransform Transform(FRotator(0.0f, 0.0f, 8.0f),
            Position, FVector(0.012f, 0.012f, 0.38f));
        RainInstances->AddInstance(Transform);
    }
    SetRainVisible(bRainEnabled);
}

void AFLRealisticWeatherManager::SetRainVisible(bool bVisible)
{
    if (RainInstances) RainInstances->SetVisibility(bVisible, true);
}

void AFLRealisticWeatherManager::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    SetRainVisible(bRainEnabled);
    if (!bRainEnabled || !RainInstances || DropPositions.IsEmpty()) return;

    FVector Center = GetActorLocation();
    if (APlayerController* PC = GetWorld()->GetFirstPlayerController())
    {
        if (PC->PlayerCameraManager) Center = PC->PlayerCameraManager->GetCameraLocation();
    }

    for (int32 Index = 0; Index < DropPositions.Num(); ++Index)
    {
        FVector& Position = DropPositions[Index];
        Position.Z -= RainFallSpeed * DeltaSeconds;
        if (Position.Z < -100.0f)
        {
            Position.X = FMath::FRandRange(-RainRadius, RainRadius);
            Position.Y = FMath::FRandRange(-RainRadius, RainRadius);
            Position.Z = FMath::FRandRange(1800.0f, 3200.0f);
        }
        const FVector WorldPosition = Center + Position;
        RainInstances->UpdateInstanceTransform(Index,
            FTransform(FRotator(0.0f, 0.0f, 8.0f), WorldPosition,
                FVector(0.012f, 0.012f, 0.38f)), true, false, true);
    }
    RainInstances->MarkRenderStateDirty();
}
