using UnrealBuildTool;
using System.Collections.Generic;

public class FrankfurtLifeSanAndreasEditorTarget : TargetRules
{
    public FrankfurtLifeSanAndreasEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V2;
        ExtraModuleNames.Add("FrankfurtLifeSanAndreas");
    }
}
