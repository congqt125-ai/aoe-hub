import { useMemo, useState } from "react";
import { Button, Dialog, Tabs, cx } from "../../../../components";
import {
  CHANGELOG_ENTRIES,
  type ChangelogEntry,
  type ChangelogProduct,
  type ChangelogTag,
} from "../../homeMock";
import { LINE, PanelTitle } from "../panel";

export interface WhatsNewProps {
  seenVersions: Set<string>;
  hasUnseenOverride?: boolean;
  onMarkSeen: (versionKeys: string[]) => void;
  /** External request to open changelog dialog (e.g. from HeroCarousel). */
  dialogRequest?: { product: ChangelogProduct; version?: string; id: number } | null;
}

const TAG_STYLE: Record<ChangelogTag, string> = {
  Mới: "bg-success text-success-on",
  "Sửa lỗi": "bg-warning text-warning-on",
  "Cân bằng": "bg-info text-info-on",
  "Hiệu năng": "bg-black/70 text-tone-focus bevel-flat",
};

const keyOf = (e: Pick<ChangelogEntry, "product" | "version">) => `${e.product}:${e.version}`;

/** §3.4 "Có gì mới" card with Software / Core game tabs, unseen dots, and full changelog Dialog. */
export function WhatsNew({
  seenVersions,
  hasUnseenOverride = true,
  onMarkSeen,
  dialogRequest,
}: WhatsNewProps) {
  const [product, setProduct] = useState<ChangelogProduct>("software");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [lastReqId, setLastReqId] = useState<number>(0);

  if (dialogRequest && dialogRequest.id !== lastReqId) {
    setLastReqId(dialogRequest.id);
    setProduct(dialogRequest.product);
    const target =
      CHANGELOG_ENTRIES.find(
        (e) => e.product === dialogRequest.product && (!dialogRequest.version || e.version === dialogRequest.version),
      ) ?? CHANGELOG_ENTRIES[0];
    if (target) {
      setSelectedKey(keyOf(target));
      onMarkSeen([keyOf(target)]);
    }
    setDialogOpen(true);
  }

  const list = useMemo(
    () => CHANGELOG_ENTRIES.filter((e) => e.product === product),
    [product],
  );
  const recent = list.slice(0, 4);

  const isUnseen = (e: ChangelogEntry) => hasUnseenOverride && !seenVersions.has(keyOf(e));

  const openFullDialog = (entry?: ChangelogEntry) => {
    const picked = entry ?? list[0];
    if (picked) {
      setSelectedKey(keyOf(picked));
      onMarkSeen(list.map(keyOf));
    }
    setDialogOpen(true);
  };

  const activeEntry =
    CHANGELOG_ENTRIES.find((e) => keyOf(e) === selectedKey) ??
    list[0] ??
    CHANGELOG_ENTRIES[0];

  return (
    <section
      aria-label="Có gì mới"
      className="flex min-h-0 flex-col overflow-hidden bg-black/55 bevel-raised-2"
    >
      <PanelTitle
        trailing={
          <Tabs<ChangelogProduct>
            label="Nhóm cập nhật"
            variant="segmented"
            size="sm"
            value={product}
            onChange={setProduct}
            items={[
              { value: "software", label: "Phần mềm" },
              { value: "coregame", label: "Core game" },
            ]}
          />
        }
      >
        Có gì mới
      </PanelTitle>
      <div className={`h-px shrink-0 ${LINE}`} />

      <div className="min-h-0 flex-1 divide-y divide-white/10 overflow-y-auto">
        {recent.map((e) => (
          <button
            key={keyOf(e)}
            type="button"
            onClick={() => openFullDialog(e)}
            className="flex w-full flex-col gap-1 px-3 py-2 text-left transition-colors duration-fast hover:bg-white/5 focus-visible:outline-game-out"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isUnseen(e) && (
                  <span
                    aria-label="Phiên bản mới chưa xem"
                    className="inline-block h-2 w-2 rounded-full bg-danger"
                  />
                )}
                <span className="font-heading text-sm font-semibold text-tone-state">
                  {e.version}
                </span>
                <span className="font-body text-xs text-tone-text/60">{e.date}</span>
              </div>
              <div className="flex items-center gap-1">
                {e.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cx(
                      "inline-flex h-[16px] items-center px-1.5 font-heading text-[11px] font-semibold leading-none text-shadow-none",
                      TAG_STYLE[tag],
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <p className="m-0 line-clamp-1 font-body text-sm text-tone-text/85">
              {e.highlights[0]}
            </p>
          </button>
        ))}
      </div>

      <div className={`h-px shrink-0 ${LINE}`} />
      <div className="flex h-9 shrink-0 items-center justify-end bg-black/20 px-3">
        <Button variant="secondary" size="sm" onClick={() => openFullDialog()}>
          Xem tất cả →
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Nhật ký cập nhật"
        description={product === "software" ? "Phần mềm SuperAoE Hub" : "Core game 1.0c"}
        size="lg"
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(false)}>
            Đóng
          </Button>
        }
      >
        <div className="flex h-[340px] gap-4 overflow-hidden">
          <div className="flex w-44 shrink-0 flex-col gap-1 overflow-y-auto bg-black/35 p-2 bevel-sunken-1">
            {list.map((e) => {
              const selected = keyOf(e) === keyOf(activeEntry);
              return (
                <button
                  key={keyOf(e)}
                  type="button"
                  onClick={() => {
                    setSelectedKey(keyOf(e));
                    onMarkSeen([keyOf(e)]);
                  }}
                  className={cx(
                    "flex items-center justify-between px-2.5 py-1.5 text-left font-body text-sm focus-visible:outline-game-out",
                    selected
                      ? "bg-tone-bevel-0/25 font-bold text-tone-focus"
                      : "text-tone-text hover:bg-white/5",
                  )}
                >
                  <span>{e.version}</span>
                  <span className="text-xs text-tone-text/60">{e.date}</span>
                </button>
              );
            })}
          </div>

          <div className="min-w-0 flex-1 overflow-y-auto bg-black/35 p-4 bevel-sunken-1">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="m-0 font-heading text-lg font-semibold text-tone-state">
                Phiên bản {activeEntry.version}
              </h3>
              <span className="font-body text-sm text-tone-text/65">{activeEntry.date}</span>
            </div>
            <div className="flex flex-col gap-3">
              {activeEntry.details.map((group) => (
                <div key={group.tag} className="flex flex-col gap-1">
                  <span
                    className={cx(
                      "inline-flex h-[18px] w-fit items-center px-1.5 font-heading text-xs font-semibold leading-none text-shadow-none",
                      TAG_STYLE[group.tag],
                    )}
                  >
                    {group.tag}
                  </span>
                  <ul className="m-0 list-disc pl-5 font-body text-sm text-tone-text/90">
                    {group.items.map((item) => (
                      <li key={item} className="py-0.5">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </section>
  );
}

