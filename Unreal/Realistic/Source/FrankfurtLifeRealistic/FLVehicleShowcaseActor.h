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
    virtual void Tick(float DeltaSeconds) override;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle")
    int32 VehicleStyle = 0;
    void EnterVehicle(AFLRealisticCharacter* Character);
    void ExitVehicle();
    UFUNCTION(BlueprintPure, Category="Vehicle|Fuel") float GetFuelPercent() const { return FuelPercent; }
    UFUNCTION(BlueprintPure, Category="Vehicle|Fuel") bool HasFuel() const { return FuelPercent > 0.0f; }
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
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle|Fuel", meta=(ClampMin="1.0")) float FuelCapacityLitres = 55.0f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle|Fuel", meta=(ClampMin="0.01")) float LitresPerHourAtFullThrottle = 11.0f;
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle|Fuel") float FuelPercent = 100.0f;
    float CurrentThrottle = 0.0f;
    void DriveForward(float Value);
    void Steer(float Value);
    void AddPart(UStaticMesh* Mesh, const FVector& Location, const FVector& Scale, const FLinearColor& Tint, const FRotator& Rotation = FRotator::ZeroRotator);
    void BuildSedan();
    void BuildVan();
    void BuildPoliceCar();
};