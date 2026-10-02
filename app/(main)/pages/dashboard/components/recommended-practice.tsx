"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Chip } from "@heroui/react";
import { Rocket } from "@gravity-ui/icons";

const recommendations = [
  {
    icon: "📐",
    title: "Practice Math",
    description: "Improve your problem-solving skills.",
    duration: "20 min",
  },
  {
    icon: "📖",
    title: "Practice Reading & Writing",
    description: "Strengthen your reading and grammar.",
    duration: "25 min",
  },
  {
    icon: "🎯",
    title: "Take a Full Practice",
    description: "Test your overall SAT performance.",
    duration: "45 min",
  },
];

export default function RecommendedPractice() {
  const router = useRouter();

  return (
    <section className="mt-8">
      <Card className="border border-default-200 bg-background shadow-sm">
        <Card.Header className="border-b border-default-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Rocket width={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Recommended Practice
              </h2>

              <p className="mt-1 text-sm text-default-500">
                Choose what you want to work on next.
              </p>
            </div>
          </div>
        </Card.Header>

        <Card.Content className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-default-200 bg-default-50 p-5 transition-all hover:border-primary-200 hover:bg-background hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-2xl shadow-sm">
                    {item.icon}
                  </div>

                  <Chip
                    size="sm"
                    variant="primary"
                    color="default"
                  >
                    {item.duration}
                  </Chip>
                </div>

                <h3 className="mt-5 font-semibold">
                  {item.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-default-500">
                  {item.description}
                </p>

                <Button
                  className="mt-5 w-full"
                  variant="primary"
                  onPress={() => router.push("/pages/practice")}
                >
                  Start Practice
                </Button>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    </section>
  );
}

