'use server';
import { NextResponse } from "next/server";

import { prisma } from "../../../../util/prisma";

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

interface SectionBody {
  action:
    | "FINISH_SECTION"
    | "START_NEXT_SECTION";
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    // TODO: lấy từ auth
    const userId = "CURRENT_USER_ID";

    const { sessionId } = await context.params;

    const body =
      (await request.json()) as SectionBody;

    if (
      body.action !==
        "FINISH_SECTION" &&
      body.action !==
        "START_NEXT_SECTION"
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid section action",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * Load session
     */
    const session =
      await prisma.fullTestSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },

        select: {
          id: true,
          status: true,
          currentSectionOrder: true,

          sections: {
            orderBy: {
              examSection: {
                order: "asc",
              },
            },

            select: {
              id: true,
              status: true,
              startedAt: true,
              timeSpent: true,
              remainingTime: true,

              examSection: {
                select: {
                  id: true,
                  subject: true,
                  title: true,
                  order: true,
                  duration: true,
                  breakAfter: true,
                },
              },
            },
          },
        },
      });

    if (!session) {
      return NextResponse.json(
        {
          message: "Session not found",
        },
        {
          status: 404,
        },
      );
    }

    /**
     * START_NEXT_SECTION
     *
     * Chỉ được gọi khi đang BREAK
     */
    if (
      body.action ===
      "START_NEXT_SECTION"
    ) {
      if (session.status !== "BREAK") {
        return NextResponse.json(
          {
            message:
              "Session is not in break",
          },
          {
            status: 409,
          },
        );
      }

      const nextSection =
        session.sections.find(
          (section) =>
            section.examSection.order >
            session.currentSectionOrder,
        );

      if (!nextSection) {
        return NextResponse.json(
          {
            message:
              "No next section available",
          },
          {
            status: 409,
          },
        );
      }

      const now = new Date();

      const result =
        await prisma.$transaction(
          async (tx) => {
            /**
             * Start Math
             */
            const updatedSection =
              await tx.fullTestSectionSession.update(
                {
                  where: {
                    id: nextSection.id,
                  },

                  data: {
                    status: "IN_PROGRESS",

                    startedAt: now,

                    remainingTime:
                      nextSection.examSection.duration *
                      60,

                    timeSpent: 0,
                  },
                },
              );

            /**
             * Update main session
             */
            const updatedSession =
              await tx.fullTestSession.update(
                {
                  where: {
                    id: session.id,
                  },

                  data: {
                    status: "IN_PROGRESS",

                    currentSectionOrder:
                      nextSection.examSection.order,
                  },
                },
              );

            return {
              session:
                updatedSession,

              section:
                updatedSection,
            };
          },
        );

      return NextResponse.json(
        {
          data: {
            sessionId:
              result.session.id,

            status:
              result.session.status,

            currentSectionOrder:
              result.session
                .currentSectionOrder,

            currentSection: {
              sessionId:
                result.section.id,

              sectionId:
                nextSection.examSection.id,

              subject:
                nextSection.examSection
                  .subject,

              title:
                nextSection.examSection
                  .title,

              order:
                nextSection.examSection
                  .order,

              duration:
                nextSection.examSection
                  .duration,

              remainingTime:
                nextSection.examSection
                  .duration * 60,
            },
          },
        },
        {
          status: 200,
        },
      );
    }

    /**
     * FINISH_SECTION
     */
    if (
      session.status !== "IN_PROGRESS"
    ) {
      return NextResponse.json(
        {
          message:
            "Session is not active",
        },
        {
          status: 409,
        },
      );
    }

    /**
     * Current section
     */
    const currentSection =
      session.sections.find(
        (section) =>
          section.examSection.order ===
          session.currentSectionOrder,
      );

    if (!currentSection) {
      return NextResponse.json(
        {
          message:
            "Current section not found",
        },
        {
          status: 404,
        },
      );
    }

    if (
      currentSection.status !==
      "IN_PROGRESS"
    ) {
      return NextResponse.json(
        {
          message:
            "Current section is not active",
        },
        {
          status: 409,
        },
      );
    }

    /**
     * Server-side timer
     */
    if (!currentSection.startedAt) {
      return NextResponse.json(
        {
          message:
            "Section start time is missing",
        },
        {
          status: 500,
        },
      );
    }

    const now = new Date();

    const elapsedSeconds = Math.floor(
      (now.getTime() -
        currentSection.startedAt.getTime()) /
        1000,
    );

    const durationSeconds =
      currentSection.examSection
        .duration * 60;

    /**
     * User chỉ được finish:
     *
     * - trước thời gian hết hạn
     * - hoặc đúng lúc hết giờ
     *
     * Server tự quyết định.
     */
    const actualTimeSpent =
      Math.min(
        elapsedSeconds,
        durationSeconds,
      );

    /**
     * Nếu là R&W
     *
     * → BREAK
     */
    if (
      currentSection.examSection
        .subject === "SAT_RW"
    ) {
      const result =
        await prisma.$transaction(
          async (tx) => {
            await tx.fullTestSectionSession.update(
              {
                where: {
                  id: currentSection.id,
                },

                data: {
                  status: "COMPLETED",

                  completedAt: now,

                  timeSpent:
                    actualTimeSpent,

                  remainingTime: 0,
                },
              },
            );

            const updatedSession =
              await tx.fullTestSession.update(
                {
                  where: {
                    id: session.id,
                  },

                  data: {
                    status: "BREAK",
                  },
                },
              );

            return updatedSession;
          },
        );

      return NextResponse.json(
        {
          data: {
            sessionId:
              result.id,

            status:
              result.status,

            currentSectionOrder:
              result.currentSectionOrder,

            break: {
              duration: 600,
            },
          },
        },
        {
          status: 200,
        },
      );
    }

    /**
     * Nếu là Math
     *
     * → COMPLETED
     */
    if (
      currentSection.examSection
        .subject === "SAT_MATH"
    ) {
      const result =
        await prisma.$transaction(
          async (tx) => {
            await tx.fullTestSectionSession.update(
              {
                where: {
                  id: currentSection.id,
                },

                data: {
                  status: "COMPLETED",

                  completedAt: now,

                  timeSpent:
                    actualTimeSpent,

                  remainingTime: 0,
                },
              },
            );

            const updatedSession =
              await tx.fullTestSession.update(
                {
                  where: {
                    id: session.id,
                  },

                  data: {
                    status: "COMPLETED",

                    completedAt: now,

                    totalTimeSpent:
                      Math.floor(
                        (now.getTime() -
                          session.sections[0]
                            .startedAt!
                            .getTime()) /
                          1000,
                      ),
                  },
                },
              );

            return updatedSession;
          },
        );

      return NextResponse.json(
        {
          data: {
            sessionId:
              result.id,

            status:
              result.status,

            currentSectionOrder:
              result.currentSectionOrder,
          },
        },
        {
          status: 200,
        },
      );
    }

    return NextResponse.json(
      {
        message:
          "Unsupported section subject",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "PATCH /api/full-tests/sessions/[sessionId]/section error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Failed to update section",
      },
      {
        status: 500,
      },
    );
  }
}
