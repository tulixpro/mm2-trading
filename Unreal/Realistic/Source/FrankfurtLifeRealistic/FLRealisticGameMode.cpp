#include "FLRealisticGameMode.h"
#include "FLRealisticCharacter.h"
#include "FLRealisticCityBlock.h"
#include "FLRealisticHUD.h"
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
        FActorSpawnParameters Params;
        Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
        World->SpawnActor<AFLRealisticCityBlock>(
            AFLRealisticCityBlock::StaticClass(),
            FVector::ZeroVector,
            FRotator::ZeroRotator,
            Params);
    }
}
