#include "FLRealisticGameMode.h"
#include "FLRealisticCharacter.h"
#include "FLRealisticCityBlock.h"
#include "Engine/World.h"

AFLRealisticGameMode::AFLRealisticGameMode()
{
    DefaultPawnClass = AFLRealisticCharacter::StaticClass();
    bStartPlayersAsSpectators = false;
}

void AFLRealisticGameMode::StartPlay()
{
    Super::StartPlay();

    if (UWorld* World = GetWorld())
    {
        FActorSpawnParameters Params;
        Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
        World->SpawnActor<AFLRealisticCityBlock>(
            AFLRealisticCityBlock::StaticClass(),
            FVector(4200.0f, 4200.0f, 0.0f),
            FRotator::ZeroRotator,
            Params);
    }
}