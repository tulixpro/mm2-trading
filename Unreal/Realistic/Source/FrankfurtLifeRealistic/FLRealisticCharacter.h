#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "FLRealisticCharacter.generated.h"
class UCameraComponent;
class USpringArmComponent;
UCLASS()
class FRANKFURTLIFEREALISTIC_API AFLRealisticCharacter : public ACharacter
{
    GENERATED_BODY()
public:
    AFLRealisticCharacter();
protected:
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;
private:
    UPROPERTY(VisibleAnywhere, Category="Camera") USpringArmComponent* CameraBoom;
    UPROPERTY(VisibleAnywhere, Category="Camera") UCameraComponent* FollowCamera;
    void MoveForward(float Value);
    void MoveRight(float Value);
    void Interact();
};