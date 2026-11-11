"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { useTranslations } from "next-intl";
import axios from "axios";

import CurrentPlanCard from "./components/current-plan-card";
import PaymentHistoryTable from "./components/payment-history-table";
import { useAuthStore } from "@/zustand/auth-store";
import { useRouter } from "next/navigation";

interface Subscription {
    id: string;
    plan: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    createdAt: string;
}

export default function SubscriptionPage() {
    const t = useTranslations("subscription");
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { checkAuth, isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/");
        }
    }, [isLoading, isAuthenticated, router]);

    const fetchCurrent = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/subscriptions/current", {
                withCredentials: true,
            });
            setSubscription(res.data.subscription ?? null);
        } catch {
            setSubscription(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchCurrent();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
            <header>
                <h1 className="text-3xl font-bold">{t("title")}</h1>
                <p className="mt-2 text-default-500">{t("subtitle")}</p>
            </header>

            <CurrentPlanCard
                subscription={subscription}
                onRefresh={fetchCurrent}
            />

            <PaymentHistoryTable />
        </div>
    );
}