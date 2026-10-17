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
import { useTranslations } from "next-intl";
import axios from "axios";
import { ArrowChevronRight } from "@gravity-ui/icons";

import { usePracticeStore } from "@/zustand/practice-store";
import { useAuthStore } from "@/zustand/auth-store";
import { usePracticeConfigStore } from "@/zustand/practice-config";

import { useRouter } from "next/navigation";
import MultiSelect from "../multiselect/multiselect";

const SUBJECT_KEYS = [
  { id: "SAT_RW", labelKey: "rw" },
  { id: "SAT_MATH", labelKey: "math" },
] as const;

const LEVEL_KEYS = [
  { id: "easy", labelKey: "easy" },
  { id: "medium", labelKey: "medium" },
  { id: "hard", labelKey: "hard" },
] as const;

const QUESTION_COUNT_KEYS = [
  { id: "15", labelKey: "15", plans: ["FREE", "BASIC", "PREMIUM", "VIP"] },
  { id: "25", labelKey: "25", plans: ["BASIC", "PREMIUM", "VIP"] },
  { id: "50", labelKey: "50", plans: ["PREMIUM", "VIP"] },
] as const;

const CATEGORY_OPTIONS = {
  SAT_MATH: [
    { id: "Algebra", label: "Algebra" },
    { id: "Advanced Math", label: "Advanced Math" },
    {
      id: "Problem Solving and Data Analysis",
      label: "Problem Solving and Data Analysis",
    },
    { id: "Geometry", label: "Geometry" },
  ],
  SAT_RW: [
    { id: "Craft and Structure", label: "Craft and Structure" },
    { id: "Information and Ideas", label: "Information and Ideas" },
    {
      id: "Standard English Conventions",
      label: "Standard English Conventions",
    },
    { id: "Expression of Ideas", label: "Expression of Ideas" },
  ],
} as const;

type Subject = "SAT_RW" | "SAT_MATH";

type CategoryOption = {
  id: string;
  label: string;
};

type PracticeCategories = Record<string, string[]>;

export default function PracticeSetUp() {
  const router = useRouter();
  const t = useTranslations("practiceSetup");

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

  const [categoriesLoading, setCategoriesLoading] = React.useState(false);

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
        console.error("Failed to load practice categories:", error);
        setPracticeCategories({});
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [subject]);

  const categoryOptions: CategoryOption[] = React.useMemo(() => {
    if (!subject) return [];
    return [...CATEGORY_OPTIONS[subject]];
  }, [subject]);

  const subtopicOptions = React.useMemo(() => {
    if (categories.length === 0) return [];

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
      toast.warning(t("toast.subjectRequiredTitle"), {
        actionProps: {
          children: t("toast.okButton"),
          onPress: () => toast.clear(),
          variant: "tertiary",
        },
        description: t("toast.subjectRequiredDescription"),
      });

      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post("/api/practice/create", {
        subject,

        domain: categories.length > 0 ? categories : undefined,

        subtopic: subtopics.length > 0 ? subtopics : undefined,

        questionCount: count === "all" ? 999 : Number(count),

        mode:
          level.length === 0
            ? "ALL_LEVEL"
            : level.includes("all")
              ? "ALL_LEVEL"
              : level.map((item) => item.toUpperCase()),
      });

      if (!data.success) {
        throw new Error(data.error ?? "Failed to create practice");
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
      toast.danger(t("toast.startFailedTitle"), {
        actionProps: {
          children: t("toast.gotItButton"),
          onPress: () => toast.clear(),
          variant: "tertiary",
        },

        description: axios.isAxiosError(error)
          ? error.response?.data?.error || t("toast.startFailedDescription")
          : error instanceof Error
            ? error.message
            : t("toast.genericError"),
      });
    } finally {
      setLoading(false);
    }
  };

  const subtopicPlaceholder = !subject
    ? t("placeholders.selectSubjectFirst")
    : categories.length === 0
      ? t("placeholders.selectCategoryFirst")
      : categoriesLoading
        ? t("placeholders.loadingSubtopics")
        : subtopicOptions.length === 0
          ? t("placeholders.noSubtopics")
          : t("placeholders.selectSubtopics");

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
              placeholder={t("placeholders.selectSubject")}
            >
              <Label className="text-sm font-medium">
                {t("labels.subject")}
              </Label>

              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>

              <Select.Popover>
                <ListBox>
                  {SUBJECT_KEYS.map((item) => (
                    <ListBox.Item
                      key={item.id}
                      id={item.id}
                      textValue={t(`subjects.${item.labelKey}`)}
                    >
                      {t(`subjects.${item.labelKey}`)}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="min-w-0">
            <Label className="mb-2 block text-sm font-medium">
              {t("labels.categories")}
            </Label>

            <MultiSelect
              options={categoryOptions}
              value={categories}
              onChange={handleCategoriesChange}
              placeholder={
                !subject
                  ? t("placeholders.selectSubjectFirst")
                  : t("placeholders.selectCategories")
              }
              disabled={!subject || categoriesLoading}
            />
          </div>

          <div className="min-w-0">
            <Label className="mb-2 block text-sm font-medium">
              {t("labels.subtopics")}
            </Label>

            <MultiSelect
              options={subtopicOptions}
              value={subtopics}
              onChange={handleSubtopicsChange}
              placeholder={subtopicPlaceholder}
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
              label={t("labels.difficulty")}
              placeholder={t("placeholders.selectDifficulty")}
              options={LEVEL_KEYS.map((l) => ({
                id: l.id,
                label: t(`levels.${l.labelKey}`),
              }))}
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
              placeholder={t("placeholders.questions")}
            >
              <Label className="text-sm font-medium">
                {t("labels.questions")}
              </Label>

              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>

              <Select.Popover>
                <ListBox>
                  {QUESTION_COUNT_KEYS.map((item) => {
                    const isAllowed = (
                      item.plans as readonly string[]
                    ).includes(userPlan);

                    return (
                      <ListBox.Item
                        key={item.id}
                        id={item.id}
                        textValue={t(`questionCounts.${item.labelKey}`)}
                        isDisabled={!isAllowed}
                      >
                        <div className="flex w-full items-center justify-between gap-4">
                          <span>{t(`questionCounts.${item.labelKey}`)}</span>

                          {!isAllowed && (
                            <span className="text-xs text-default-400">
                              {t("upgrade")}
                            </span>
                          )}

                          {isAllowed && <ListBox.ItemIndicator />}
                        </div>
                      </ListBox.Item>
                    );
                  })}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="flex min-w-0 justify-end sm:col-span-2 lg:col-span-1">
            <Button
              variant="primary"
              className="h-12 w-full rounded-full px-8 font-semibold shadow-md transition-all hover:shadow-lg sm:w-auto"
              onPress={handleStart}
              isDisabled={!subject || loading}
            >
              <span className="mr-1">
                <ArrowChevronRight />
              </span>

              {loading ? t("startingButton") : t("startButton")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}