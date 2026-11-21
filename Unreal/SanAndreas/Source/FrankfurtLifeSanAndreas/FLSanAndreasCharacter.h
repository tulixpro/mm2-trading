#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "FLSanAndreasCharacter.generated.h"

class UCameraComponent;
class USpringArmComponent;

UCLASS()
class FRANKFURTLIFESANANDREAS_API AFLSanAndreasCharacter : public ACharacter
{
    GENERATED_BODY()
public:
    AFLSanAndreasCharacter();
protected:
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;
private:
    UPROPERTY(VisibleAnywhere, Category="Camera")
    USpringArmComponent* CameraBoom;
    UPROPERTY(VisibleAnywhere, Category="Camera")
    UCameraComponent* FollowCamera;
    void MoveForward(float Value);
    void MoveRight(float Value);
};
