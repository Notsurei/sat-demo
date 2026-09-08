"use client";

import React from "react";
import { ScrollShadow, Card } from "@heroui/react";
import MathText from "@/app/components/LaText/MathJax";

export default function ReferenceSheet() {
  return (
    <div className="min-h-screen bg-default-50 dark:bg-default-900 p-4 md:p-6">
      <Card className="mb-4 border-none shadow-sm">
        <Card.Content className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span>📄</span> SAT Math Reference Sheet
              </h1>
              <p className="text-sm text-default-500">
                Key formulas and concepts for the SAT Math section
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>
    
      <Card className="border-none shadow-sm">
        <Card.Content className="p-0">
          <ScrollShadow className="h-[calc(100vh-300px)] w-full p-6 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              <section>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <span>📐</span> Area &amp; Circumference
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-default-200 dark:border-default-700 bg-white dark:bg-default-800 p-4 text-center">
                    <div className="text-4xl mb-2">⬤</div>
                    <div className="space-y-1 text-sm">
                      <div className="font-semibold text-foreground">
                        Circle
                      </div>
                      <MathText text="$A = \pi r^2$" />
                      <MathText text="$C = 2\pi r$" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-default-200 dark:border-default-700 bg-white dark:bg-default-800 p-4 text-center">
                    <div className="text-4xl mb-2">▭</div>
                    <div className="space-y-1 text-sm">
                      <div className="font-semibold text-foreground">
                        Rectangle
                      </div>
                      <MathText text="$A = lw$" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-default-200 dark:border-default-700 bg-white dark:bg-default-800 p-4 text-center">
                    <div className="text-4xl mb-2">▲</div>
                    <div className="space-y-1 text-sm">
                      <div className="font-semibold text-foreground">
                        Triangle
                      </div>
                      <MathText text="$A = \dfrac{1}{2}bh$" />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <span>📏</span> Pythagorean Theorem
                </h3>
                <div className="rounded-xl border border-default-200 dark:border-default-700 bg-white dark:bg-default-800 p-4 flex items-center gap-6">
                  <div className="text-5xl">📐</div>
                  <div>
                    <MathText text="$a^2 + b^2 = c^2$" />
                    <p className="text-xs text-default-500 mt-1">
                      (right triangle, <span className="italic">c</span> =
                      hypotenuse)
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <span>🔺</span> Special Right Triangles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-default-200 dark:border-default-700 bg-white dark:bg-default-800 p-4">
                    <div className="font-semibold text-foreground mb-2">
                      30° – 60° – 90°
                    </div>
                    <div className="space-y-1 text-sm text-default-700 dark:text-default-300">
                      <div>
                        Short leg: <span className="font-mono">x</span>
                      </div>
                      <div>
                        Long leg: <span className="font-mono">x√3</span>
                      </div>
                      <div>
                        Hypotenuse: <span className="font-mono">2x</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-default-200 dark:border-default-700 bg-white dark:bg-default-800 p-4">
                    <div className="font-semibold text-foreground mb-2">
                      45° – 45° – 90°
                    </div>
                    <div className="space-y-1 text-sm text-default-700 dark:text-default-300">
                      <div>
                        Leg: <span className="font-mono">x</span>
                      </div>
                      <div>
                        Leg: <span className="font-mono">x</span>
                      </div>
                      <div>
                        Hypotenuse: <span className="font-mono">x√2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <span>📦</span> Volume
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {[
                    {
                      icon: "🟫",
                      label: "Rectangular Box",
                      formula: "$V = lwh$",
                    },
                    {
                      icon: "🥫",
                      label: "Cylinder",
                      formula: "$V = \pi r^2 h$",
                    },
                    {
                      icon: "🔺",
                      label: "Cone",
                      formula: "$V = \dfrac{1}{3}\pi r^2 h$",
                    },
                    {
                      icon: "⚽",
                      label: "Sphere",
                      formula: "$V = \dfrac{4}{3}\pi r^3$",
                    },
                    {
                      icon: "🔷",
                      label: "Pyramid",
                      formula: "$V = \dfrac{1}{3}lwh$",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-default-200 dark:border-default-700 bg-white dark:bg-default-800 p-4 text-center"
                    >
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="font-semibold text-xs text-foreground mb-1">
                        {item.label}
                      </div>
                      <MathText text={item.formula} />
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <span>ℹ️</span> Key Facts
                </h3>
                <div className="rounded-xl border border-default-200 dark:border-default-700 bg-white dark:bg-default-800 p-4 space-y-1 text-sm text-default-700 dark:text-default-300">
                  <div>
                    • The number of degrees of arc in a circle is <b>360°</b>
                  </div>
                  <div>
                    • The number of radians of arc in a circle is <b>2π</b>
                  </div>
                  <div>
                    • The sum of the measures in degrees of the angles of a
                    triangle is <b>180°</b>
                  </div>
                  <div>
                    • Sum of angles on a straight line: <b>180°</b>
                  </div>
                  <div>
                    • Exterior angle of a triangle = sum of the two non-adjacent
                    interior angles
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <span>📊</span> Other Useful Formulas
                </h3>
                <div className="rounded-xl border border-default-200 dark:border-default-700 bg-white dark:bg-default-800 p-4 space-y-3 text-sm text-default-700 dark:text-default-300">
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <span>
                      <b>Slope:</b>{" "}
                      <MathText text="$m = \dfrac{y_2 - y_1}{x_2 - x_1}$" />
                    </span>
                    <span>
                      <b>Slope-intercept:</b> <MathText text="$y = mx + b$" />
                    </span>
                    <span>
                      <b>Standard form:</b> <MathText text="$ax + by = c$" />
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <span>
                      <b>Quadratic formula:</b>{" "}
                      <MathText text="$x = \dfrac{-b \pm \sqrt{b^2 - 4ac}}{2a}$" />
                    </span>
                    <span>
                      <b>Discriminant:</b>{" "}
                      <MathText text="$\Delta = b^2 - 4ac$" />
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <span>
                      <b>Distance:</b>{" "}
                      <MathText text="$d = \sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$" />
                    </span>
                    <span>
                      <b>Midpoint:</b>{" "}
                      <MathText text="$\left(\dfrac{x_1+x_2}{2},\, \dfrac{y_1+y_2}{2}\right)$" />
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <span>
                      <b>Percent change:</b>{" "}
                      <MathText text="$\dfrac{\text{new} - \text{old}}{\text{old}} \times 100\%$" />
                    </span>
                    <span>
                      <b>Simple interest:</b> <MathText text="$I = Prt$" />
                    </span>
                  </div>
                  <div>
                    <b>Exponential growth/decay:</b>{" "}
                    <MathText text="$A = P(1 + r)^t$" /> &nbsp;/&nbsp;{" "}
                    <MathText text="$A = P(1 - r)^t$" />
                  </div>
                </div>
              </section>
            </div>
          </ScrollShadow>
        </Card.Content>
      </Card>
    </div>
  );
}
