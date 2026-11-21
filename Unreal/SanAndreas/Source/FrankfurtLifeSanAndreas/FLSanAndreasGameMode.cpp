#include "FLSanAndreasGameMode.h"
#include "FLSanAndreasCharacter.h"

AFLSanAndreasGameMode::AFLSanAndreasGameMode()
{
    DefaultPawnClass = AFLSanAndreasCharacter::StaticClass();
    bStartPlayersAsSpectators = false;
}
