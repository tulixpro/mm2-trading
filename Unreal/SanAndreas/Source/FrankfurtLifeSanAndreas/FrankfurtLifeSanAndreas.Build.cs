using UnrealBuildTool;

public class FrankfurtLifeSanAndreas : ModuleRules
{
    public FrankfurtLifeSanAndreas(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDependencyModuleNames.AddRange(new string[] {
            "Core", "CoreUObject", "Engine", "InputCore"
        });
    }
}
