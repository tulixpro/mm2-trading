#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "FLVehicleShowcaseActor.generated.h"
class UBoxComponent;
class USceneComponent;
class UCameraComponent;
class UFloatingPawnMovement;
class UStaticMesh;
class AFLRealisticCharacter;

UCLASS()
class FRANKFURTLIFEREALISTIC_API AFLVehicleShowcaseActor : public APawn
{
    GENERATED_BODY()
public:
    AFLVehicleShowcaseActor();
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle")
    int32 VehicleStyle = 0;
    void EnterVehicle(AFLRealisticCharacter* Character);
    void ExitVehicle();
protected:
    virtual void BeginPlay() override;
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;
private:
    UPROPERTY() UBoxComponent* CollisionRoot;
    UPROPERTY() USceneComponent* SceneRoot;
    UPROPERTY() UCameraComponent* DriverCamera;
    UPROPERTY() UFloatingPawnMovement* VehicleMovement;
    UPROPERTY() UStaticMesh* CubeMesh;
    UPROPERTY() UStaticMesh* CylinderMesh;
    UPROPERTY() AFLRealisticCharacter* PreviousDriver;
    void DriveForward(float Value);
    void Steer(float Value);
    void AddPart(UStaticMesh* Mesh, const FVector& Location, const FVector& Scale, const FLinearColor& Tint, const FRotator& Rotation = FRotator::ZeroRotator);
    void BuildSedan();
    void BuildVan();
    void BuildPoliceCar();
};