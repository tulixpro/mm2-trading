#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "FLRealisticHUD.generated.h"

UCLASS()
class FRANKFURTLIFEREALISTIC_API AFLRealisticHUD : public AHUD
{
    GENERATED_BODY()

public:
    virtual void BeginPlay() override;
    virtual void DrawHUD() override;

private:
    float ScreenStartTime = 0.0f;
};
