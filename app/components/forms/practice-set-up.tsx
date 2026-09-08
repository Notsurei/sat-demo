"use client";

import React from "react";

import {
  Button,
  Label,
  ListBox,
  Select,
  Card,
  toast,
} from "@heroui/react";

import { useRouter } from "next/navigation";

import axios from "axios";

import { ArrowChevronRight } from "@gravity-ui/icons";

import { usePracticeStore } from "@/zustand/practice-store";
import { useAuthStore } from "@/zustand/auth-store";
import { usePracticeConfigStore } from "@/zustand/practice-config";

import MultiSelect from "../multiselect/multiselect";

const SUBJECTS = [
  {
    id: "SAT_RW",
    label: "Reading & Writing",
  },
  {
    id: "SAT_MATH",
    label: "Math",
  },
];

const LEVELS = [
  {
    id: "easy",
    label: "Easy",
  },
  {
    id: "medium",
    label: "Medium",
  },
  {
    id: "hard",
    label: "Hard",
  },
];

const QUESTION_COUNTS = [
  {
    id: "15",
    label: "15 Questions",
    plans: ["FREE", "BASIC", "PREMIUM", "VIP"],
  },
  {
    id: "25",
    label: "25 Questions",
    plans: ["BASIC", "PREMIUM", "VIP"],
  },
  {
    id: "50",
    label: "50 Questions",
    plans: ["PREMIUM", "VIP"],
  },
];

const CATEGORY_OPTIONS = {
  SAT_MATH: [
    {
      id: "Algebra",
      label: "Algebra",
    },
    {
      id: "Advanced Math",
      label: "Advanced Math",
    },
    {
      id: "Problem Solving and Data Analysis",
      label: "Problem Solving and Data Analysis",
    },
    {
      id: "Geometry",
      label: "Geometry",
    },
  ],

  SAT_RW: [
    {
      id: "Craft and Structure",
      label: "Craft and Structure",
    },
    {
      id: "Information and Ideas",
      label: "Information and Ideas",
    },
    {
      id: "Standard English Conventions",
      label: "Standard English Conventions",
    },
    {
      id: "Expression of Ideas",
      label: "Expression of Ideas",
    },
  ],
};

type Subject = "SAT_RW" | "SAT_MATH";

type CategoryOption = {
  id: string;
  label: string;
};

type PracticeCategories = Record<string, string[]>;

export default function PracticeSetUp() {
  const router = useRouter();

  const { user } = useAuthStore();
  const { setConfig } = usePracticeConfigStore();

  const [subject, setSubject] = React.useState<Subject | null>(null);

  const [categories, setCategories] = React.useState<string[]>([]);
  const [subtopics, setSubtopics] = React.useState<string[]>([]);
  const [level, setLevel] = React.useState<string[]>([]);

  const [count, setCount] = React.useState<string>("15");
  const [loading, setLoading] = React.useState(false);
  const [practiceCategories, setPracticeCategories] =
    React.useState<PracticeCategories>({});

  const [categoriesLoading, setCategoriesLoading] =
    React.useState(false);

  const userPlan = user?.subscriptionPlan ?? "FREE";
  React.useEffect(() => {
    if (!subject) {
      setPracticeCategories({});
      setCategories([]);
      setSubtopics([]);
      return;
    }

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);

        const { data } = await axios.get(
          `/api/practice/categories?subject=${subject}`,
        );

        if (data.success) {
          setPracticeCategories(data.categories ?? {});
        } else {
          setPracticeCategories({});
        }
      } catch (error) {
        console.error(
          "Failed to load practice categories:",
          error,
        );

        setPracticeCategories({});
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [subject]);

  const categoryOptions: CategoryOption[] = React.useMemo(() => {
    if (!subject) {
      return [];
    }

    return CATEGORY_OPTIONS[subject];
  }, [subject]);

  const subtopicOptions = React.useMemo(() => {
    if (categories.length === 0) {
      return [];
    }

    const result = new Set<string>();

    categories.forEach((category) => {
      const topics = practiceCategories[category] ?? [];

      topics.forEach((topic) => {
        result.add(topic);
      });
    });

    return Array.from(result).map((subtopic) => ({
      id: subtopic,
      label: subtopic,
    }));
  }, [categories, practiceCategories]);

  const handleCategoriesChange = (values: string[]) => {
    setCategories(values);

    setSubtopics((currentSubtopics) => {
      const availableSubtopics = new Set<string>();

      values.forEach((category) => {
        const topics = practiceCategories[category] ?? [];

        topics.forEach((topic) => {
          availableSubtopics.add(topic);
        });
      });

      return currentSubtopics.filter((topic) =>
        availableSubtopics.has(topic),
      );
    });
  };

  const handleSubtopicsChange = (values: string[]) => {
    setSubtopics(values);
  };

  const handleStart = async () => {
    if (!subject) {
      toast.warning("Please select a subject", {
        actionProps: {
          children: "OK",
          onPress: () => toast.clear(),
          variant: "tertiary",
        },
        description:
          "Cannot start practice without selecting a subject",
      });

      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(
        "/api/practice/create",
        {
          subject,

          domain:
            categories.length > 0
              ? categories
              : undefined,

          subtopic:
            subtopics.length > 0
              ? subtopics
              : undefined,

          questionCount:
            count === "all"
              ? 999
              : Number(count),

          mode:
            level.length === 0
              ? "ALL_LEVEL"
              : level.includes("all")
                ? "ALL_LEVEL"
                : level.map((item) =>
                    item.toUpperCase(),
                  ),
        },
      );

      if (!data.success) {
        throw new Error(
          data.error ?? "Failed to create practice",
        );
      }

      setConfig({
        subject,
        category: categories.join(", "),
        subtopic: subtopics.join(", "),
      });

      usePracticeStore.setState({
        practiceId: data.practiceId,
        questions: data.questions,
        currentQuestion: 0,
      });

      router.push(`/practice/${data.practiceId}`);
    } catch (error) {
      toast.danger("Failed to start practice", {
        actionProps: {
          children: "I got it",
          onPress: () => toast.clear(),
          variant: "tertiary",
        },

        description: axios.isAxiosError(error)
          ? error.response?.data?.error ||
            "Please try again later"
          : error instanceof Error
            ? error.message
            : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-default-200 bg-default-50 p-4 shadow-sm dark:bg-default-800 sm:p-6">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="min-w-0">
            <Select
              className="w-full"
              selectedKey={subject}
              onSelectionChange={(key) => {
                const value = key as Subject;

                setSubject(value);
                setCategories([]);
                setSubtopics([]);
              }}
              placeholder="Select subject"
            >
              <Label className="text-sm font-medium">
                Subject
              </Label>

              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>

              <Select.Popover>
                <ListBox>
                  {SUBJECTS.map((item) => (
                    <ListBox.Item
                      key={item.id}
                      id={item.id}
                      textValue={item.label}
                    >
                      {item.label}

                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="min-w-0">
            <Label className="mb-2 block text-sm font-medium">
              Categories
            </Label>

            <MultiSelect
              options={categoryOptions}
              value={categories}
              onChange={handleCategoriesChange}
              placeholder={
                !subject
                  ? "Select subject first"
                  : "Select categories"
              }
              disabled={!subject || categoriesLoading}
            />
          </div>

          <div className="min-w-0">
            <Label className="mb-2 block text-sm font-medium">
              Subtopics
            </Label>

            <MultiSelect
              options={subtopicOptions}
              value={subtopics}
              onChange={handleSubtopicsChange}
              placeholder={
                categories.length === 0
                  ? "Select category first"
                  : categoriesLoading
                    ? "Loading subtopics..."
                    : subtopicOptions.length === 0
                      ? "No subtopics"
                      : "Select subtopics"
              }
              disabled={
                categories.length === 0 ||
                categoriesLoading ||
                subtopicOptions.length === 0
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="min-w-0">
            <MultiSelect
              label="Difficulty"
              placeholder="Select difficulty"
              options={LEVELS}
              value={level}
              onChange={(values) => {
                if (values.includes("all")) {
                  setLevel(["all"]);
                  return;
                }

                setLevel(values);
              }}
            />
          </div>

          <div className="min-w-0">
            <Select
              className="w-full"
              selectedKey={count}
              onSelectionChange={(key) => {
                setCount(key ? String(key) : "15");
              }}
              placeholder="Questions"
            >
              <Label className="text-sm font-medium">
                Questions
              </Label>

              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>

              <Select.Popover>
                <ListBox>
                  {QUESTION_COUNTS.map((item) => {
                    const isAllowed =
                      item.plans.includes(userPlan);

                    return (
                      <ListBox.Item
                        key={item.id}
                        id={item.id}
                        textValue={item.label}
                        isDisabled={!isAllowed}
                      >
                        <div className="flex w-full items-center justify-between gap-4">
                          <span>{item.label}</span>

                          {!isAllowed && (
                            <span className="text-xs text-default-400">
                              🔒 Upgrade
                            </span>
                          )}

                          {isAllowed && (
                            <ListBox.ItemIndicator />
                          )}
                        </div>
                      </ListBox.Item>
                    );
                  })}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="min-w-0 flex justify-end sm:col-span-2 lg:col-span-1">
            <Button
              variant="primary"
              className="h-12 w-full rounded-full px-8 font-semibold shadow-md transition-all hover:shadow-lg sm:w-auto"
              onPress={handleStart}
              isDisabled={!subject || loading}
            >
              <span className="mr-1">
                <ArrowChevronRight />
              </span>

              {loading ? "Starting..." : "Start"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
