"use client";
import {
    BookOpen,
    Bulb,
    Calculator,
    TriangleExclamationFill,
} from "@gravity-ui/icons";
import { Accordion, Button, Card, Chip, Input, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { knowledgeDB } from "../../../../config/knowledge_db";
import { useAuthStore } from "@/zustand/auth-store";
import parser from 'html-react-parser';
import React from "react";

type Subject = "rw" | "math";
type TopicFlat = {
    id: number;
    subj: Subject;
    di: number;
    si: number;
    name: string;
    domain: string;
};
export default function knowledgeReview() {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedTopicId, setSelectedTopicId] = React.useState<number>(0);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const contentRef = React.useRef<HTMLDivElement>(null);
    const router = useRouter();

    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

    React.useEffect(() => {
        checkAuth();
    }, []);

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/");
        }
    }, [isLoading, isAuthenticated, router]);

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

        if (window.MathJax && contentRef.current) {
            await window.MathJax.typesetPromise([contentRef.current]);
        }

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
            <Card className="mb-4 border-none shadow-sm">
                <Card.Content className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                        <Button
                            onPress={() => router.push("/")}
                            variant="primary"
                            size="sm"
                        >
                            Home
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">
                                📚 Knowledge Review
                            </h1>
                            <p className="text-sm text-default-500">
                                Key concepts · Pro tips · Common traps · Video resources
                            </p>
                        </div>
                    </div>
                    <Input
                        placeholder="🔍 Search any topic..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64"
                    />
                </Card.Content>
            </Card>

            <div className="flex flex-col gap-4 lg:flex-row items-start">
                <Card className="lg:w-80 flex-shrink-0 border-none shadow-sm overflow-hidden">
                    <Card.Content className="p-0">
                        {Object.entries(knowledgeDB).map(([subj, domains]) => {
                            const filteredDomains = domains
                                .map((dom: any, di: number) => {
                                    const subs = dom.subtopics.filter((sub: any, si: number) => {
                                        const idx = flatTopics.findIndex(
                                            (t) => t.subj === subj && t.di === di && t.si === si,
                                        );
                                        if (idx === -1) return false;
                                        return filteredTopics.some((ft) => ft === flatTopics[idx]);
                                    });
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
                    </Card.Content>
                </Card>

                <Card className="flex-1 border-none shadow-sm overflow-hidden">
                    <Card.Content ref={contentRef} className="p-6">
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
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {selectedTopic.name}
                                    </h2>
                                    <Chip className="mt-1" variant="primary" size="sm">
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
                                                        <li
                                                            key={i}
                                                        >{parser(kp)}</li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                {selectedTopic.diagram && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                            📊 Logic Diagram
                                        </h3>
                                        <div
                                            className="
                            flex
                            justify-center
                            w-full
                            rounded-2xl
                            border
                            border-default-200
                            bg-default-100
                            p-6
                            dark:border-default-700
                            dark:bg-default-800
                            overflow-x-auto
                        "

                                        >{parser(selectedTopic.diagram)}</div>
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
                                        <div className="mt-1 rounded-xl border border-primary-200 bg-primary-50 p-4 text-foreground dark:border-primary-800 dark:bg-primary-950">{parser(selectedTopic.tip)}</div>
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
                                        <div className="mt-1 p-4 rounded-xl bg-warning-50 dark:bg-warning-950 border border-warning-200 dark:border-warning-800 text-foreground">
                                            {selectedTopic.trap}
                                        </div>
                                    </div>
                                )}
                                {selectedTopic.videos && selectedTopic.videos.length > 0 && (
                                    <div>
                                        {/* <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                                <Video className="w-5 h-5 text-primary" />
                                                Video Resources
                                            </h3> */}
                                        {/* <div className="mt-2 space-y-2">
                                            {selectedTopic.videos.map((v: any, i: number) => (
                                                <a
                                                    key={i}
                                                    href={v.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 rounded-xl border border-default-200 dark:border-default-700 hover:bg-default-100 dark:hover:bg-default-800 transition-colors"
                                                >
                                                    <span className="text-xl">▶️</span>
                                                    <span className="flex-1 text-sm font-medium text-foreground">{v.title}</span>
                                                    <Chip size="sm" variant="primary">open</Chip>
                                                </a>
                                            ))}
                                        </div> */}
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
                    </Card.Content>
                </Card>
            </div>
        </div>
    );
}