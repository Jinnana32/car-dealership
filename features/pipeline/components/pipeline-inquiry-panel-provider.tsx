"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactElement,
  type ReactNode,
} from "react";

import { Sheet, SheetBody, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  loadInquiryPanelData,
  type InquiryPanelDataResult,
} from "@/features/inquiries/actions";
import {
  InquiryDetailHeaderActions,
  InquiryDetailPanelHeader,
  InquiryDetailPanels,
} from "@/features/inquiries/components/inquiry-detail-panels";

type PipelineInquiryPanelContextValue = {
  closeInquiry: () => void;
  openInquiry: (inquiryId: string) => void;
};

const PipelineInquiryPanelContext =
  createContext<PipelineInquiryPanelContextValue | null>(null);

export function usePipelineInquiryPanel(): PipelineInquiryPanelContextValue {
  const context = useContext(PipelineInquiryPanelContext);

  if (!context) {
    throw new Error("usePipelineInquiryPanel must be used within PipelineInquiryPanelProvider.");
  }

  return context;
}

type PipelineInquiryPanelProviderProps = {
  children: ReactNode;
  redirectPath: string;
};

function PanelLoadingState(): ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-[20px]" />
      <Skeleton className="h-40 w-full rounded-[20px]" />
      <Skeleton className="h-48 w-full rounded-[20px]" />
      <Skeleton className="h-56 w-full rounded-[20px]" />
    </div>
  );
}

function PanelErrorState({ message }: { message: string }): ReactElement {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Try again or open the inquiry from the pipeline list.
      </p>
    </div>
  );
}

export function PipelineInquiryPanelProvider({
  children,
  redirectPath,
}: PipelineInquiryPanelProviderProps): ReactElement {
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [panelData, setPanelData] = useState<InquiryPanelDataResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!inquiryId) {
      setPanelData(null);
      return;
    }

    startTransition(() => {
      void loadInquiryPanelData(inquiryId).then(setPanelData);
    });
  }, [inquiryId]);

  function closeInquiry(): void {
    setInquiryId(null);
  }

  function openInquiry(nextInquiryId: string): void {
    setInquiryId(nextInquiryId);
  }

  const isOpen = inquiryId !== null;
  const showLoading = isOpen && (isPending || panelData === null);
  const panelResult =
    panelData && inquiryId && panelData.type === "ok" ? panelData.data : null;

  return (
    <PipelineInquiryPanelContext.Provider value={{ closeInquiry, openInquiry }}>
      {children}

      <Sheet onOpenChange={(open) => !open && closeInquiry()} open={isOpen}>
        <SheetContent>
          {showLoading ? (
            <>
              <SheetHeader onClose={closeInquiry}>
                <p className="text-xl font-semibold text-foreground">Loading inquiry...</p>
              </SheetHeader>
              <SheetBody>
                <PanelLoadingState />
              </SheetBody>
            </>
          ) : panelResult ? (
            <>
              <SheetHeader
                actions={
                  <InquiryDetailHeaderActions
                    customerId={panelResult.record.customer.id}
                    inquiryId={panelResult.record.inquiry.id}
                    record={panelResult.record}
                    showFullPageLink
                  />
                }
                onClose={closeInquiry}
              >
                <InquiryDetailPanelHeader layout="panel" record={panelResult.record} />
              </SheetHeader>
              <SheetBody>
                <InquiryDetailPanels
                  canAssignInquiries={panelResult.canAssignInquiries}
                  canManageInquiry={panelResult.canManageInquiry}
                  canRecordSale={panelResult.canRecordSale}
                  defaultFinancierName={panelResult.defaultFinancierName}
                  financingAprPercent={panelResult.financingAprPercent}
                  layout="panel"
                  memberOptions={panelResult.memberOptions}
                  record={panelResult.record}
                  redirectTo={redirectPath}
                  saleRecord={panelResult.saleRecord}
                  vehicleOptions={panelResult.vehicleOptions}
                />
              </SheetBody>
            </>
          ) : panelData?.type === "forbidden" ? (
            <>
              <SheetHeader onClose={closeInquiry}>
                <p className="text-xl font-semibold text-foreground">Inquiry unavailable</p>
              </SheetHeader>
              <SheetBody>
                <PanelErrorState message="You do not have access to this inquiry." />
              </SheetBody>
            </>
          ) : panelData?.type === "not_found" ? (
            <>
              <SheetHeader onClose={closeInquiry}>
                <p className="text-xl font-semibold text-foreground">Inquiry unavailable</p>
              </SheetHeader>
              <SheetBody>
                <PanelErrorState message="This inquiry could not be found." />
              </SheetBody>
            </>
          ) : panelData?.type === "unauthorized" ? (
            <>
              <SheetHeader onClose={closeInquiry}>
                <p className="text-xl font-semibold text-foreground">Inquiry unavailable</p>
              </SheetHeader>
              <SheetBody>
                <PanelErrorState message="Admin access is required to view inquiries." />
              </SheetBody>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </PipelineInquiryPanelContext.Provider>
  );
}
