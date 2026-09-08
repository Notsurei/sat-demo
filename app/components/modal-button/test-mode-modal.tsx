import React from "react";
import { Button, Modal, ScrollShadow } from "@heroui/react";
import { BookOpen, ChartBar, Dots9, Thunderbolt } from "@gravity-ui/icons";
import PracticeSetUp from "../forms/practice-set-up";

const MODES = [
  {
    id: "rw",
    icon: <BookOpen className="h-6 w-6" />,
    title: "Reading & Writing",
    description: "Reading & Writing modules only.",
  },
  {
    id: "math",
    icon: <ChartBar className="h-6 w-6" />,
    title: "Math",
    description: "SAT Math only.",
  },
  {
    id: "full",
    icon: <Thunderbolt className="h-6 w-6" />,
    title: "Full Test",
    description: "Simulate the complete Digital SAT.",
  },
  {
    id: "practice",
    icon: <span className="text-3xl">🎯</span>,
    title: "Targeted Practice",
    description: "Practice by topic and difficulty.",
  },
];

export default function TestModeModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedMode, setSelectedMode] = React.useState<"rw" | "math" | "full" | null>(null);
  const [showPracticeSetup, setShowPracticeSetup] = React.useState(false);

  const handleModeSelect = (mode: string) => {
    switch (mode) {
      case "rw":
      case "math":
      case "full":
        setSelectedMode(mode);
        setIsOpen(false);
        break;
      case "practice":
        setShowPracticeSetup(true);
        break;
    }
  };

  React.useEffect(() => {
    if (selectedMode) {
      console.log("Selected mode:", selectedMode);
      // TODO: navigate or start test
    }
  }, [selectedMode]);

  const mainModes = MODES.slice(0, 3);
  const practiceMode = MODES[3];

  return (
    <>
      <Button
        variant="primary"
        className="rounded-full px-6 font-semibold"
        onPress={() => setIsOpen(true)}
      >
        📝 Start Test
      </Button>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-5xl w-full">
              <Modal.CloseTrigger />

              <Modal.Header className="flex items-center gap-2">
                <Dots9 />
                <span className="text-xl font-bold">Choose your test mode</span>
              </Modal.Header>

              <Modal.Body>
                <ScrollShadow className="max-h-[550px] p-4 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    {mainModes.map((mode) => (
                      <div
                        key={mode.id}
                        onClick={() => handleModeSelect(mode.id)}
                        className="
                          group
                          flex flex-col items-start gap-3
                          rounded-2xl border border-default-200
                          bg-content1 p-6
                          transition-all duration-200
                          hover:-translate-y-1 hover:border-primary
                          hover:shadow-lg hover:bg-primary-50
                          dark:hover:bg-primary-950
                          cursor-pointer w-full
                        "
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleModeSelect(mode.id);
                          }
                        }}
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                          {mode.icon}
                        </div>
                        <h3 className="text-lg font-semibold">{mode.title}</h3>
                        <p className="text-sm text-default-500">{mode.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] gap-4 mt-4 w-full">
                    <div className="w-full min-w-0">
                      <div
                        onClick={() => handleModeSelect(practiceMode.id)}
                        className={`
        group flex flex-col items-start gap-3
        rounded-2xl border p-6 h-full w-full
        transition-all duration-200
        hover:-translate-y-1 hover:border-primary
        hover:shadow-lg hover:bg-primary-50
        dark:hover:bg-primary-950
        cursor-pointer
        ${showPracticeSetup
                            ? "border-primary bg-primary-50 dark:bg-primary-950"
                            : "border-default-200 bg-content1"
                          }
      `}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleModeSelect(practiceMode.id);
                          }
                        }}
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                          {practiceMode.icon}
                        </div>

                        <h3 className="text-lg font-semibold">
                          {practiceMode.title}
                        </h3>

                        <p className="text-sm text-default-500">
                          {practiceMode.description}
                        </p>

                        {/* {showPracticeSetup && (
                          <span className="mt-2 text-xs font-medium text-primary">
                            ✅ Customizing...
                          </span>
                        )} */}
                      </div>
                    </div>

                    <div className="w-full min-w-0">
                      <div className="flex min-h-[150px] h-full w-full items-center justify-center rounded-2xl border border-dashed border-default-300 bg-default-50/50 p-4 dark:bg-default-800/50">
                        {showPracticeSetup ? (
                          <div className="w-full">
                            <PracticeSetUp />
                          </div>
                        ) : (
                          <div className="text-center text-default-400">
                            <p className="text-sm">
                              Select "Targeted Practice"
                            </p>

                            <p className="mt-1 text-xs">
                              to customize your session
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollShadow>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="outline" onPress={() => setIsOpen(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}