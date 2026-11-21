#include "FLRealisticGameMode.h"
#include "FLRealisticCharacter.h"

AFLRealisticGameMode::AFLRealisticGameMode()
{
    DefaultPawnClass = AFLRealisticCharacter::StaticClass();
    bStartPlayersAsSpectators = false;
}
