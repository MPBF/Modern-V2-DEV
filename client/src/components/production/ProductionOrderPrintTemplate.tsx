import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedName } from "../../hooks/use-localized-name";
import { format } from "date-fns";
import "../../print.css";

interface ProductionOrderPrintTemplateProps {
  productionOrder: any;
  order: any;
  customer: any;
  customerProduct: any;
  item: any;
  machine: any;
  operator: any;
  rolls: any[];
  onClose: () => void;
}

export default function ProductionOrderPrintTemplate({
  productionOrder,
  order,
  customer,
  customerProduct,
  item,
  machine,
  operator,
  rolls,
  onClose,
}: ProductionOrderPrintTemplateProps) {
  const { t } = useTranslation();
  const ln = useLocalizedName();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const qrData = JSON.stringify({
          type: "production_order",
          production_order_id: productionOrder.id,
          production_order_number: productionOrder.production_order_number,
          order_number: order?.order_number,
          customer: ln(customer?.name_ar, customer?.name),
          date: productionOrder.created_at,
        });
        const qrUrl = await QRCode.toDataURL(qrData, {
          width: 120,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error("خطأ في إنشاء رمز QR:", error);
      }
    };

    generateQRCode();
  }, [productionOrder, order, customer]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      waiting: t("production.print.status.waiting"),
      for_production: t("production.print.status.forProduction"),
      in_production: t("production.print.status.inProduction"),
      pending: t("production.print.status.pending"),
      active: t("production.print.status.active"),
      paused: t("production.print.status.paused"),
      on_hold: t("production.print.status.onHold"),
      in_progress: t("production.print.status.inProgress"),
      completed: t("production.print.status.completed"),
      cancelled: t("production.print.status.cancelled"),
      delivered: t("production.print.status.delivered"),
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed": 
      case "delivered": 
        return "print-badge print-badge-success";
      case "active": 
      case "in_production":
      case "in_progress":
        return "print-badge print-badge-info";
      case "for_production":
        return "print-badge print-badge-primary";
      case "cancelled": 
        return "print-badge print-badge-danger";
      case "paused":
      case "on_hold":
        return "print-badge print-badge-secondary";
      default: 
        return "print-badge print-badge-warning";
    }
  };

  const getRollStageText = (stage: string) => {
    const stageMap: Record<string, string> = {
      film: t("production.print.stage.film"),
      printing: t("production.print.stage.printing"),
      cutting: t("production.print.stage.cutting"),
      done: t("production.print.stage.done"),
    };
    return stageMap[stage] || stage;
  };

  const totalRolls = rolls.length;
  const completedRolls = rolls.filter((r: any) => r.stage === "done").length;
  const totalWeight = rolls.reduce(
    (sum: number, r: any) => sum + parseFloat(r.weight_kg || 0),
    0
  );
  const targetQuantity = parseFloat(productionOrder.final_quantity_kg || 0) || parseFloat(productionOrder.quantity_kg || 0);
  const progressPercentage =
    targetQuantity > 0
      ? (totalWeight / targetQuantity) * 100
      : 0;

  return (
    <div className="production-print-container">
      {/* Scoped print styles for this component */}
      <style>
        {`
          @media print {
            /* Hide preview elements */
            .print-preview-overlay,
            .print-preview-toolbar,
            .print-preview-paper,
            .no-print {
              display: none !important;
            }

            /* Show and position the print area */
            .production-print-area {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 5mm !important;
              background: white !important;
            }

            @page {
              size: A4 landscape;
              margin: 0;
            }
          }
        `}
      </style>

      {/* شريط أدوات المعاينة */}
      <div className="print-preview-overlay no-print">
        <div className="print-preview-toolbar">
          <div className="print-preview-toolbar-title">
            <h2>{t("production.print.productionOrder")}</h2>
            <span>#{productionOrder.production_order_number}</span>
          </div>
          <div className="print-preview-toolbar-actions">
            <button 
              onClick={handlePrint} 
              className="print-preview-btn-print"
              data-testid="button-print-production-order"
            >
              {t("production.print.print")}
            </button>
            <button 
              onClick={onClose} 
              className="print-preview-btn-close"
              data-testid="button-close-print"
            >
              {t("production.print.close")}
            </button>
          </div>
        </div>

        {/* معاينة الورقة على الشاشة */}
        <div className="print-preview-paper">
          <PrintContentInner
            productionOrder={productionOrder}
            order={order}
            customer={customer}
            customerProduct={customerProduct}
            item={item}
            qrCodeUrl={qrCodeUrl}
            totalRolls={totalRolls}
            completedRolls={completedRolls}
            totalWeight={totalWeight}
            progressPercentage={progressPercentage}
            getStatusText={getStatusText}
            getStatusBadgeClass={getStatusBadgeClass}
            getRollStageText={getRollStageText}
            rolls={rolls}
          />
        </div>
      </div>

      {/* المحتوى الفعلي للطباعة - مخفي على الشاشة ويظهر فقط عند الطباعة */}
      <div className="production-print-area" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <PrintContentInner
          productionOrder={productionOrder}
          order={order}
          customer={customer}
          customerProduct={customerProduct}
          item={item}
          qrCodeUrl={qrCodeUrl}
          totalRolls={totalRolls}
          completedRolls={completedRolls}
          totalWeight={totalWeight}
          progressPercentage={progressPercentage}
          getStatusText={getStatusText}
          getStatusBadgeClass={getStatusBadgeClass}
          getRollStageText={getRollStageText}
          rolls={rolls}
        />
      </div>
    </div>
  );
}

function PrintContentInner({
  productionOrder,
  order,
  customer,
  customerProduct,
  item,
  qrCodeUrl,
  totalRolls,
  completedRolls,
  totalWeight,
  progressPercentage,
  getStatusText,
  getStatusBadgeClass,
  getRollStageText,
  rolls,
}: any) {
  const { t } = useTranslation();
  const ln = useLocalizedName();
  return (
    <div className="print-page">
      {/* الترويسة */}
      <div className="print-header">
        <div className="print-header-right">
          <h1 className="print-title">{t("production.print.productionOrder")}</h1>
          <p className="print-subtitle">{t("production.print.productionOrderEn")}</p>
          <div className="print-order-number">#{productionOrder.production_order_number}</div>
        </div>
        <div className="print-header-center">
          <h2 className="print-company">{t("production.print.companyName")}</h2>
          <p className="print-subtitle">{t("production.print.companyNameEn")}</p>
        </div>
        <div className="print-header-left">
          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="QR Code" className="print-qr" />
          )}
        </div>
      </div>

      {/* معلومات أمر الإنتاج */}
      <div className="print-info-grid">
        <div className="print-info-box">
          <div className="print-info-label">{t("production.print.orderNumber")}</div>
          <div className="print-info-value">{order?.order_number || t("production.print.notSpecified")}</div>
        </div>
        <div className="print-info-box">
          <div className="print-info-label">{t("production.print.customer")}</div>
          <div className="print-info-value">{ln(customer?.name_ar, customer?.name) || t("production.print.notSpecified")}</div>
        </div>
        <div className="print-info-box">
          <div className="print-info-label">{t("production.print.statusLabel")}</div>
          <div className="print-info-value">
            <span className={getStatusBadgeClass(productionOrder.status)}>
              {getStatusText(productionOrder.status)}
            </span>
          </div>
        </div>
        <div className="print-info-box">
          <div className="print-info-label">{t("production.print.creationDate")}</div>
          <div className="print-info-value">
            {productionOrder.created_at
              ? format(new Date(productionOrder.created_at), "dd/MM/yyyy")
              : t("production.print.notSpecified")}
          </div>
        </div>
        <div className="print-info-box highlight">
          <div className="print-info-label">{t("production.print.requiredQuantity")}</div>
          <div className="print-info-value large">
            {parseFloat(productionOrder.final_quantity_kg || productionOrder.quantity_kg || 0).toFixed(2)} {t("production.print.kg")}
            {parseFloat(productionOrder.overrun_percentage || 0) > 0 && (
              <span style={{ fontSize: "12px", color: "#2563eb", marginRight: "4px" }}>
                (+{productionOrder.overrun_percentage}%)
              </span>
            )}
          </div>
        </div>
        <div className="print-info-box">
          <div className="print-info-label">{t("production.print.completionRate")}</div>
          <div className="print-info-value">{progressPercentage.toFixed(1)}%</div>
        </div>
      </div>

      {/* مواصفات المنتج */}
      <div className="print-section print-avoid-break">
        <h3 className="print-section-title">{t("production.print.productSpecs")}</h3>
        <div className="print-specs-grid">
          <div className="print-specs-item">
            <strong>{t("production.print.itemName")}:</strong>
            {ln(item?.name_ar, item?.name) || t("production.print.notSpecified")}
          </div>
          <div className="print-specs-item">
            <strong>{t("production.print.size")}:</strong>
            {customerProduct?.size_caption || t("production.print.notSpecified")}
          </div>
          <div className="print-specs-item">
            <strong>{t("production.print.width")}:</strong>
            {customerProduct?.width || t("production.print.notSpecified")} {t("production.print.cm")}
          </div>
          <div className="print-specs-item">
            <strong>{t("production.print.thickness")}:</strong>
            {customerProduct?.thickness || t("production.print.notSpecified")} {t("production.print.micron")}
          </div>
          <div className="print-specs-item">
            <strong>{t("production.print.rightFacing")}:</strong>
            {customerProduct?.right_facing || t("production.print.notSpecified")} {t("production.print.cm")}
          </div>
          <div className="print-specs-item">
            <strong>{t("production.print.leftFacing")}:</strong>
            {customerProduct?.left_facing || t("production.print.notSpecified")} {t("production.print.cm")}
          </div>
          <div className="print-specs-item">
            <strong>{t("production.print.cuttingLength")}:</strong>
            {customerProduct?.cutting_length_cm || t("production.print.notSpecified")} {t("production.print.cm")}
          </div>
          <div className="print-specs-item">
            <strong>{t("production.print.rawMaterial")}:</strong>
            {customerProduct?.raw_material || t("production.print.notSpecified")}
          </div>
          <div className="print-specs-item">
            <strong>{t("production.print.printingCylinder")}:</strong>
            {customerProduct?.printing_cylinder || t("production.print.notSpecified")}
          </div>
          <div className="print-specs-item">
            <strong>{t("production.print.printing")}:</strong>
            {customerProduct?.is_printed ? t("production.print.yes") : t("production.print.no")}
          </div>
          <div className="print-specs-item">
            <strong>{t("production.print.punching")}:</strong>
            {customerProduct?.punching || t("production.print.notSpecified")}
          </div>
          <div className="print-specs-item">
            <strong>{t("production.print.cuttingUnit")}:</strong>
            {customerProduct?.cutting_unit || t("production.print.notSpecified")}
          </div>
        </div>
      </div>

      {/* إحصائيات الإنتاج */}
      <div className="print-section print-avoid-break">
        <h3 className="print-section-title">{t("production.print.productionStats")}</h3>
        <div className="print-stats-row">
          <div className="print-stat-card">
            <div className="print-stat-label">{t("production.print.totalRolls")}</div>
            <div className="print-stat-value">{totalRolls}</div>
          </div>
          <div className="print-stat-card">
            <div className="print-stat-label">{t("production.print.completedRolls")}</div>
            <div className="print-stat-value">{completedRolls}</div>
          </div>
          <div className="print-stat-card">
            <div className="print-stat-label">{t("production.print.producedWeight")}</div>
            <div className="print-stat-value">{totalWeight.toFixed(2)} {t("production.print.kg")}</div>
          </div>
          <div className="print-stat-card">
            <div className="print-stat-label">{t("production.print.completionPercentage")}</div>
            <div className="print-stat-value">{progressPercentage.toFixed(1)}%</div>
          </div>
        </div>

        <div className="print-progress-container">
          <div
            className="print-progress-bar"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          >
            {progressPercentage > 10 && `${progressPercentage.toFixed(1)}%`}
          </div>
        </div>
      </div>

      {/* جدول الرولات */}
      {rolls.length > 0 && (
        <div className="print-section print-avoid-break">
          <h3 className="print-section-title">{t("production.print.productionLog")} ({totalRolls})</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("production.print.rollNumber")}</th>
                <th>{t("production.print.weightKg")}</th>
                <th>{t("production.print.stage")}</th>
                <th>{t("production.print.creationDate")}</th>
                <th>{t("production.print.notes")}</th>
              </tr>
            </thead>
            <tbody>
              {rolls.map((roll: any, index: number) => (
                <tr key={roll.id}>
                  <td className="text-center">{index + 1}</td>
                  <td className="text-center font-bold">{roll.roll_number}</td>
                  <td className="text-center">{parseFloat(roll.weight_kg || 0).toFixed(2)}</td>
                  <td className="text-center">
                    <span
                      className={
                        roll.stage === "done"
                          ? "print-badge print-badge-success"
                          : "print-badge print-badge-warning"
                      }
                    >
                      {getRollStageText(roll.stage)}
                    </span>
                  </td>
                  <td className="text-center">
                    {roll.created_at
                      ? format(new Date(roll.created_at), "dd/MM/yyyy HH:mm")
                      : "-"}
                  </td>
                  <td>{roll.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ textAlign: "left" }}>
                  <strong>{t("production.print.total")}:</strong>
                </td>
                <td colSpan={4}>
                  <strong>{totalWeight.toFixed(2)} {t("production.print.kg")}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ملاحظات */}
      {productionOrder.notes && (
        <div className="print-notes print-avoid-break" style={{ border: "3px solid #dc2626", padding: "14px", marginBottom: "15px", borderRadius: "6px", background: "#fff5f5", textAlign: "center" }}>
          <div className="print-notes-title" style={{ fontSize: "16px", fontWeight: 900, color: "#dc2626", marginBottom: "8px" }}>⚠️ {t("production.print.notes")} ⚠️</div>
          <div className="print-notes-content" style={{ fontSize: "20px", fontWeight: 900, color: "#dc2626", lineHeight: 1.6 }}>{productionOrder.notes}</div>
        </div>
      )}

      {/* التوقيعات */}
      <div className="print-signatures print-avoid-break">
        <div className="print-signature-box">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">{t("production.print.productionOfficer")}</div>
        </div>
        <div className="print-signature-box">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">{t("production.print.departmentSupervisor")}</div>
        </div>
        <div className="print-signature-box">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">{t("production.print.productionManager")}</div>
        </div>
      </div>

      {/* التذييل */}
      <div className="print-footer">
        <p>{t("production.print.documentGenerated")} {format(new Date(), "dd/MM/yyyy - HH:mm")}</p>
        <p>{t("production.print.systemName")}</p>
      </div>
    </div>
  );
}
