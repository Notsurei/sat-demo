"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Plus,
  TrashBin,
  CaretDown,
  CaretRight,
} from "@gravity-ui/icons";
import { ListBox, Select } from "@heroui/react";

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

type Folder = {
  id: string;
  name: string;
  tasks: Task[];
};

type Subject = {
  id: string;
  name: string;
  folders: Folder[];
};

const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: "math",
    name: "SAT Math",
    folders: [
      { id: "algebra", name: "Algebra", tasks: [] },
      { id: "geometry", name: "Geometry", tasks: [] },
      { id: "advanced", name: "Advanced Math", tasks: [] },
    ],
  },
  {
    id: "rw",
    name: "Reading & Writing",
    folders: [
      { id: "ideas", name: "Information and Ideas", tasks: [] },
      { id: "craft", name: "Craft and Structure", tasks: [] },
      { id: "expression", name: "Expression of Ideas", tasks: [] },
      { id: "english", name: "Standard English Conventions", tasks: [] },
    ],
  },
];

function ToDoList() {
  const t = useTranslations("dashboard.todoList");

  const [subjects, setSubjects] = React.useState<Subject[]>(() => {
    if (typeof window === "undefined") return DEFAULT_SUBJECTS;

    const saved = localStorage.getItem("sat-folders");

    return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
  });

  const [selectedSubject, setSelectedSubject] = React.useState("math");
  const [selectedFolder, setSelectedFolder] = React.useState("algebra");

  const [input, setInput] = React.useState("");
  const [openSubjects, setOpenSubjects] = React.useState<string[]>(["math"]);
  const [openFolders, setOpenFolders] = React.useState<string[]>(["algebra"]);

  React.useEffect(() => {
    localStorage.setItem("sat-folders", JSON.stringify(subjects));
  }, [subjects]);

  const toggleSubject = (id: string) => {
    setOpenSubjects((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addTask = () => {
    if (!input.trim()) return;

    setSubjects((prev) =>
      prev.map((subject) => {
        if (subject.id !== selectedSubject) return subject;

        return {
          ...subject,
          folders: subject.folders.map((folder) => {
            if (folder.id !== selectedFolder) return folder;

            return {
              ...folder,
              tasks: [
                ...folder.tasks,
                {
                  id: crypto.randomUUID(),
                  text: input,
                  completed: false,
                },
              ],
            };
          }),
        };
      }),
    );

    setInput("");
  };

  const toggleTask = (subjectId: string, folderId: string, taskId: string) => {
    setSubjects((prev) =>
      prev.map((subject) => {
        if (subject.id !== subjectId) return subject;

        return {
          ...subject,
          folders: subject.folders.map((folder) => {
            if (folder.id !== folderId) return folder;

            return {
              ...folder,
              tasks: folder.tasks.map((task) => {
                if (task.id !== taskId) return task;

                return {
                  ...task,
                  completed: !task.completed,
                };
              }),
            };
          }),
        };
      }),
    );
  };

  const deleteTask = (subjectId: string, folderId: string, taskId: string) => {
    setSubjects((prev) =>
      prev.map((subject) => {
        if (subject.id !== subjectId) return subject;

        return {
          ...subject,
          folders: subject.folders.map((folder) => {
            if (folder.id !== folderId) return folder;

            return {
              ...folder,
              tasks: folder.tasks.filter((task) => task.id !== taskId),
            };
          }),
        };
      }),
    );
  };

  const currentFolder = subjects
    .find((subject) => subject.id === selectedSubject)
    ?.folders.find((folder) => folder.id === selectedFolder);

  const filteredTasks = currentFolder?.tasks ?? [];
  const completedCount = filteredTasks.filter((task) => task.completed).length;

  const progress =
    filteredTasks.length > 0
      ? Math.round((completedCount / filteredTasks.length) * 100)
      : 0;

  const totalTasks = subjects.reduce(
    (sum, s) => sum + s.folders.reduce((a, f) => a + f.tasks.length, 0),
    0,
  );

  return (
    <div className="w-full max-w-full space-y-4 overflow-hidden text-slate-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t("eyebrow")}
          </p>
          <h2 className="text-lg font-semibold leading-tight text-slate-900">
            {t("title")}
          </h2>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {t("progressComplete", { progress })}
          </span>
        </div>
        <div className="self-start rounded-2xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
          {t("taskCount", { count: totalTasks })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          selectedKey={selectedSubject}
          onSelectionChange={(key) => {
            const id = key as string;

            setSelectedSubject(id);

            const firstFolder = subjects.find((s) => s.id === id)?.folders[0];

            if (firstFolder) {
              setSelectedFolder(firstFolder.id);
            }
          }}
          placeholder={t("selectSubject")}
        >
          <Select.Trigger className="flex h-11 items-center rounded-xl px-3">
            <Select.Value className="flex-1 truncate text-sm" />
            <Select.Indicator />
          </Select.Trigger>

          <Select.Popover>
            <ListBox selectionMode="single">
              {subjects.map((subject) => (
                <ListBox.Item
                  key={subject.id}
                  id={subject.id}
                  textValue={subject.name}
                >
                  {subject.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          selectedKey={selectedFolder}
          onSelectionChange={(key) => {
            setSelectedFolder(key as string);
          }}
          placeholder={t("selectFolder")}
        >
          <Select.Trigger className="flex h-11 items-center rounded-xl px-3">
            <Select.Value className="flex-1 truncate text-sm" />
            <Select.Indicator />
          </Select.Trigger>

          <Select.Popover>
            <ListBox selectionMode="single">
              {subjects
                .find((s) => s.id === selectedSubject)
                ?.folders.map((folder) => (
                  <ListBox.Item
                    key={folder.id}
                    id={folder.id}
                    textValue={folder.name}
                  >
                    {folder.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder={t("addPlaceholder")}
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        />
        <button
          onClick={addTask}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Plus />
          {t("addButton")}
        </button>
      </div>

      <div className="space-y-6">
        {subjects.map((subject) => (
          <div key={subject.id}>
            <button
              onClick={() => toggleSubject(subject.id)}
              className="mb-3 flex w-full cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-left text-lg font-bold transition hover:bg-slate-100"
            >
              <span>
                {openSubjects.includes(subject.id) ? (
                  <CaretDown />
                ) : (
                  <CaretRight />
                )}
              </span>
              <span>📁</span>
              <span className="flex-1">{subject.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {t("subjectTaskCount", {
                  count: subject.folders.reduce(
                    (total, folder) => total + folder.tasks.length,
                    0,
                  ),
                })}
              </span>
            </button>

            {openSubjects.includes(subject.id) && (
              <div className="space-y-4 border-l border-slate-200 pl-3 md:ml-5 md:pl-4">
                {subject.folders.map((folder) => (
                  <div key={folder.id}>
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="mb-2 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left font-semibold text-slate-700 transition hover:bg-blue-50"
                    >
                      <span>
                        {openFolders.includes(folder.id) ? (
                          <CaretDown />
                        ) : (
                          <CaretRight />
                        )}
                      </span>
                      <span>📂</span>
                      <span className="flex-1">{folder.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {folder.tasks.length}
                      </span>
                    </button>

                    {openFolders.includes(folder.id) && (
                      <ul className="ml-6 space-y-2 border-l border-slate-200 pl-4">
                        {folder.tasks.length === 0 ? (
                          <li className="text-sm italic text-slate-400">
                            {t("noTasks")}
                          </li>
                        ) : (
                          folder.tasks.map((task) => (
                            <li
                              key={task.id}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-slate-100"
                            >
                              <button
                                onClick={() =>
                                  toggleTask(subject.id, folder.id, task.id)
                                }
                                className="flex flex-1 items-center gap-3 text-left"
                              >
                                <span className="shrink-0 cursor-pointer">
                                  {task.completed ? <Check /> : <span>⬜</span>}
                                </span>

                                <span
                                  className={
                                    task.completed
                                      ? "text-slate-400 line-through"
                                      : "text-slate-700"
                                  }
                                >
                                  {task.text}
                                </span>
                              </button>

                              <button
                                onClick={() =>
                                  deleteTask(subject.id, folder.id, task.id)
                                }
                                className="cursor-pointer rounded-lg p-2 text-red-500 transition hover:bg-red-100"
                              >
                                <TrashBin />
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ToDoList;