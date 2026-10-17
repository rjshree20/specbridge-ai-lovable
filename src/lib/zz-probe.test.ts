import { it } from "vitest";
import { analyzePrd } from "@/lib/prd-analyzer";
import { B, C } from "./fixtures";
it("x", () => { for (const v of [B, C]) console.log(JSON.stringify(analyzePrd(v).findings.map(f=>[f.ruleId,f.severity,f.evidence,f.description]),null,1)); });
