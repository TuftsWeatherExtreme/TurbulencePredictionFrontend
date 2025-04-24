"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

function Legend() {
  const colors = [
    "rgba(35, 23, 27, 0)",
    "rgba(47, 157, 245, 1)",
    "rgba(76, 248, 132, 1)",
    "rgba(222, 221, 50, 1)",
    "rgba(246, 95, 24, 1)",
    "rgba(144, 12, 0, 1)",
  ]

  const labels = [
    "EXTRM",
    "SEV",
    "MED",
    "LGT",
    "NEG",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[16px_1fr] gap-2">
          <div className="grid grid-flow-row font-mono text-sm">
            <div className="flex bg-gradient-to-t from-[rgba(246,_95,_24,_1)] to-[rgba(144,_12,_0,_1)]" />
            <div className="flex bg-gradient-to-t from-[rgba(222,_221,_50,_1)] to-[rgba(246,_95,_24,_1)]" />
            <div className="flex bg-gradient-to-t from-[rgba(76,_248,_132,_1)] to-[rgba(222,_221,_50,_1)]" />
            <div className="flex bg-gradient-to-t from-[rgba(47,_157,_245,_1)] to-[rgba(76,_248,_132,_1)]" />
            <div className="flex bg-gradient-to-t from-[rgba(35,_23,_27,_0)] to-[rgba(47,_157,_245,_1)]" />
          </div>
          <div className="grid grid-flow-row font-mono text-sm">
            {labels.map((label, index) => {
              return (
                <span key={index}>
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Legend;
