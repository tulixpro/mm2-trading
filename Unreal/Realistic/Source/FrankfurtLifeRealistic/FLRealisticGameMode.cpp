#include "FLRealisticGameMode.h"
#include "FLRealisticWeatherManager.h"
#include "FLRealisticCharacter.h"
#include "FLRealisticCityBlock.h"
#include "FLRealisticHUD.h"
#include "FLVehicleShowcaseActor.h"
#include "Engine/World.h"

AFLRealisticGameMode::AFLRealisticGameMode()
{
    DefaultPawnClass = AFLRealisticCharacter::StaticClass();
    HUDClass = AFLRealisticHUD::StaticClass();
    bStartPlayersAsSpectators = false;
}

void AFLRealisticGameMode::StartPlay()
{
    Super::StartPlay();

    if (UWorld* World = GetWorld())
    {
        World->SpawnActor<AFLRealisticWeatherManager>(AFLRealisticWeatherManager::StaticClass(), FVector::ZeroVector, FRotator::ZeroRotator);
        FActorSpawnParameters Params;
        Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
        World->SpawnActor<AFLRealisticCityBlock>(
            AFLRealisticCityBlock::StaticClass(),
            FVector::ZeroVector,
            FRotator::ZeroRotator,
            Params);

        const FVector VehicleSpots[] = {
            FVector(-220, -1450, 85),
            FVector(220, 1450, 85),
            FVector(-1450, 220, 85),
            FVector(1450, -220, 85),
            FVector(0, -1150, 85)
        };
        const float VehicleYaw[] = { 0.0f, 180.0f, 90.0f, -90.0f, 180.0f };
        for (int32 Index = 0; Index < 5; ++Index)
        {
            const FTransform VehicleTransform(FRotator(0.0f, VehicleYaw[Index], 0.0f), VehicleSpots[Index]);
            AFLVehicleShowcaseActor* Vehicle = World->SpawnActorDeferred<AFLVehicleShowcaseActor>(
                AFLVehicleShowcaseActor::StaticClass(), VehicleTransform, nullptr, nullptr,
                ESpawnActorCollisionHandlingMethod::AlwaysSpawn);
            if (Vehicle)
            {
                Vehicle->VehicleStyle = (Index == 2) ? 1 : ((Index == 4) ? 2 : 0);
                Vehicle->FinishSpawning(VehicleTransform);
            }
        }
    }
}
