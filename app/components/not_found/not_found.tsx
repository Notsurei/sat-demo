
'use client';

import { Button } from '@heroui/react';
import { ArrowLeft, House, Magnifier } from '@gravity-ui/icons';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export default function NotFoundContent() {
    const t = useTranslations('notFound');
    const router = useRouter();

    return (
        <main className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 py-16">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
            </div>

            <section className="relative z-10 mx-auto w-full max-w-xl text-center">
                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-default-200 bg-default-100 shadow-sm">
                    <Magnifier className="h-10 w-10 text-primary" />
                </div>

                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                    {t('code')}
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                    {t('title')}
                </h1>

                <p className="mx-auto mt-5 max-w-md text-base leading-7 text-default-500 sm:text-lg">
                    {t('description')}
                </p>

                <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button
                        variant="primary"
                        size="lg"
                        onPress={() => router.push('/')}
                    >
                        <House className="h-5 w-5" /> {t('home')}
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        onPress={() => router.back()}
                    >
                        <ArrowLeft className="h-5 w-5" /> {t('back')}
                    </Button>
                </div>

                <p className="mt-12 text-sm text-default-400">
                    {t('footer')}
                </p>
            </section>
        </main>
    );
}
