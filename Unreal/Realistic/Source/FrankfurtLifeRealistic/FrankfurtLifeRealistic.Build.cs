using UnrealBuildTool;

public class FrankfurtLifeRealistic : ModuleRules
{
    public FrankfurtLifeRealistic(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDependencyModuleNames.AddRange(new string[] {
            "Core", "CoreUObject", "Engine", "InputCore"
        });
    }
}
