"use client";
import React from "react";
import {
  BookOpen,
  Books,
  Bulb,
  Calculator,
  ChartColumnStacked,
  TriangleExclamationFill,
} from "@gravity-ui/icons";
import { knowledgeDB } from "@/config/knowledge_db";
import parser from "html-react-parser";
import {
  Accordion,
  Button,
  Card,
  Chip,
  Input,
  ScrollShadow,
  Spinner,
} from "@heroui/react";

type Subject = "rw" | "math";
type TopicFlat = {
  id: number;
  subj: Subject;
  di: number;
  si: number;
  name: string;
  domain: string;
};

function KnowLedgeReview() {
  const [selectedTopicId, setSelectedTopicId] = React.useState<number>(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const flatTopics = React.useMemo<TopicFlat[]>(() => {
    const topics: TopicFlat[] = [];

    Object.entries(knowledgeDB).forEach(([subj, domains]) => {
      const subject = subj as Subject;

      domains.forEach((domain, di) => {
        domain.subtopics.forEach((topic, si) => {
          topics.push({
            id: topics.length,
            subj: subject,
            di,
            si,
            name: topic.name,
            domain: domain.domain,
          });
        });
      });
    });

    return topics;
  }, []);

  const filteredTopics = React.useMemo(() => {
    if (!searchTerm.trim()) return flatTopics;

    const keyword = searchTerm.toLowerCase();

    return flatTopics.filter((topic) => {
      const sub = knowledgeDB[topic.subj][topic.di].subtopics[topic.si];

      return (
        topic.name.toLowerCase().includes(keyword) ||
        topic.domain.toLowerCase().includes(keyword) ||
        sub.keypoints?.some((k: string) => k.toLowerCase().includes(keyword))
      );
    });
  }, [searchTerm, flatTopics]);

  React.useEffect(() => {
    if (
      filteredTopics.length > 0 &&
      !filteredTopics.find((t) => t.id === selectedTopicId)
    ) {
      setSelectedTopicId(filteredTopics[0].id);
    }
  }, [filteredTopics, selectedTopicId]);

  const handleTopicClick = async (id: number) => {
    setIsProcessing(true);

    setSelectedTopicId(id);

    await new Promise((resolve) => setTimeout(resolve, 200));

    setIsProcessing(false);
  };

  const selectedTopic = React.useMemo(() => {
    const topic = flatTopics.find((t) => t.id === selectedTopicId);

    if (!topic) return null;

    const domain = knowledgeDB[topic.subj][topic.di];
    const sub = domain.subtopics[topic.si];

    return {
      ...sub,
      domainName: domain.domain,
      domainIcon: domain.icon,
    };
  }, [selectedTopicId, flatTopics]);

  return (
    <div className="min-h-screen bg-default-50 dark:bg-default-900 p-4 md:p-6">
      <ScrollShadow className="max-h-[550px] p-4">
        <Card className="mb-4 border-none shadow-sm">
          <Card.Content className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Books className="inline-block text-blue-500" />
                  <span>Knowledge Review</span>
                </h1>
                <p className="text-sm text-default-500">
                  Key concepts · Pro tips · Common traps · Video resources
                </p>
              </div>
            </div>
            <Input
              placeholder="Search any topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64"
            />
          </Card.Content>
        </Card>

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="w-full lg:w-80 flex-shrink-0">
            <Card className="w-full border-none shadow-sm overflow-hidden">
              <Card.Content className="p-0">
                <ScrollShadow className="max-h-[200px] lg:max-h-[380px] p-4">
                  {Object.entries(knowledgeDB).map(([subj, domains]) => {
                    const filteredDomains = domains
                      .map((dom: any, di: number) => {
                        const subs = dom.subtopics.filter(
                          (sub: any, si: number) => {
                            const idx = flatTopics.findIndex(
                              (t) =>
                                t.subj === subj && t.di === di && t.si === si,
                            );
                            if (idx === -1) return false;
                            return filteredTopics.some(
                              (ft) => ft === flatTopics[idx],
                            );
                          },
                        );
                        return { ...dom, subs, di };
                      })
                      .filter((dom: any) => dom.subs.length > 0);

                    if (filteredDomains.length === 0) return null;

                    return (
                      <div key={subj}>
                        <div className="flex items-center gap-2 text-sm font-semibold text-default-700 dark:text-default-300 mb-2">
                          {subj === "rw" ? (
                            <BookOpen className="w-5 h-5" />
                          ) : (
                            <Calculator className="w-5 h-5" />
                          )}
                          {subj === "rw" ? "Reading & Writing" : "Math"}
                        </div>
                        <Accordion
                          variant="default"
                          className="px-0"
                          defaultExpandedKeys={[subj]}
                        >
                          <Accordion.Item key={subj} aria-label="Category">
                            <div className="space-y-1 pl-2">
                              {filteredDomains.map((dom: any) => (
                                <div key={`${subj}-${dom.di}`}>
                                  <div className="text-xs font-semibold text-default-500 uppercase tracking-wide mt-2 mb-1">
                                    {dom.icon} {dom.domain}
                                  </div>
                                  {dom.subs.map((sub: any) => {
                                    const idx = flatTopics.findIndex(
                                      (t) =>
                                        t.subj === subj &&
                                        t.di === dom.di &&
                                        t.si === dom.subs.indexOf(sub),
                                    );
                                    if (idx === -1) return null;
                                    return (
                                      <Button
                                        key={idx}
                                        variant={
                                          selectedTopicId === idx
                                            ? "tertiary"
                                            : "ghost"
                                        }
                                        className="w-full justify-start text-left h-auto py-2.5 px-3 rounded-lg text-sm font-medium"
                                        onPress={() => handleTopicClick(idx)}
                                      >
                                        {sub.name}
                                      </Button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </Accordion.Item>
                        </Accordion>
                      </div>
                    );
                  })}
                  {filteredTopics.length === 0 && (
                    <div className="text-center py-8 text-default-400">
                      No topics found for "{searchTerm}"
                    </div>
                  )}
                </ScrollShadow>
              </Card.Content>
            </Card>
          </div>

          <div className="flex-1 w-full min-w-0">
            <Card className="w-full border-none shadow-sm overflow-hidden">
              <Card.Content ref={contentRef} className="p-4 sm:p-6 min-w-0">
                <ScrollShadow className="w-full max-h-[60vh] p-2 sm:p-4">
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                      <Spinner size="lg" color="accent" />
                      <h2 className="text-xl font-semibold mt-4 text-foreground">
                        Processing...
                      </h2>
                      <p className="text-default-500">
                        Adaptive Algorithm is selecting the next module...
                      </p>
                    </div>
                  ) : selectedTopic ? (
                    <div className="w-full space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground break-words">
                          {selectedTopic.name}
                        </h2>
                        <Chip className="mt-1 max-w-full" variant="primary" size="sm">
                          {selectedTopic.domainIcon} {selectedTopic.domainName}
                        </Chip>
                      </div>

                      {selectedTopic.keypoints &&
                        selectedTopic.keypoints.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                              <Bulb className="w-5 h-5 text-warning" />
                              Key Points
                            </h3>
                            <ul className="mt-2 space-y-1.5 pl-6 list-disc text-default-700 dark:text-default-300">
                              {selectedTopic.keypoints.map(
                                (kp: string, i: number) => (
                                  <li key={i}>{parser(kp)}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {selectedTopic.diagram && (
                        <div>
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <ChartColumnStacked /> Logic Diagram
                          </h3>
                          <div
                            className="
                            flex justify-center w-full rounded-2xl
                            border border-default-200 bg-default-100 p-4 sm:p-6
                            dark:border-default-700 dark:bg-default-800
                            overflow-x-auto
                          "
                          >
                            {parser(selectedTopic.diagram)}
                          </div>
                        </div>
                      )}

                      {selectedTopic.tip && (
                        <div>
                          <h3
                            className="text-lg font-semibold text-foreground flex items-center gap-2"
                            style={{ color: "#0077c8" }}
                          >
                            <Bulb /> Pro Tip
                          </h3>
                          <div className="mt-1 rounded-xl border border-primary-200 bg-primary-50 p-4 text-foreground dark:border-primary-800 dark:bg-primary-950 break-words">
                            {parser(selectedTopic.tip)}
                          </div>
                        </div>
                      )}

                      {selectedTopic.trap && (
                        <div>
                          <h3
                            className="text-lg font-semibold text-foreground flex items-center gap-2"
                            style={{ color: "#856404" }}
                          >
                            <TriangleExclamationFill className="text-yellow-400" />{" "}
                            Common Trap
                          </h3>
                          <div className="mt-1 p-4 rounded-xl bg-warning-50 dark:bg-warning-950 border border-warning-200 dark:border-warning-800 text-foreground break-words">
                            {selectedTopic.trap}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-default-400">
                      <div className="text-6xl mb-4">📖</div>
                      <p className="text-lg font-semibold">
                        Select a topic from the left panel
                      </p>
                      <p className="text-sm mt-1">
                        to view key concepts, tips, diagrams & videos
                      </p>
                    </div>
                  )}
                </ScrollShadow>
              </Card.Content>
            </Card>
          </div>
        </div>
      </ScrollShadow>
    </div>
  );
}

export default KnowLedgeReview;