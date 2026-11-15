import { useId, useMemo, useState } from "react";
import {
  Avatar, Button, ChatMessage, Icon, Surface, TabPanel, Tabs, Tooltip, cx,
  type ChatMessageData, type Texture,
} from "../../../../components";
import {
  bgAssetUrl, ITEM_CATEGORY_LABELS, type InventoryItem, type ItemCategory,
  type ItemRarity, type ProfileData,
} from "../../profileMock";

const CATEGORIES: ItemCategory[] = ["avatar", "frame", "title", "bg", "chatIcon"];

const RARITY_TEXTURE: Record<ItemRarity, Texture> = {
  common: "wood",
  rare: "sandstone",
  epic: "marble",
  legendary: "darkstone",
};

const RARITY_LABEL: Record<ItemRarity, string> = {
  common: "Thường",
  rare: "Hiếm",
  epic: "Sử thi",
  legendary: "Huyền thoại",
};

const FRAME_PREVIEW_RING: Record<ItemRarity, string> = {
  common: "ring-2 ring-tone-text/50",
  rare: "ring-2 ring-info",
  epic: "ring-2 ring-tone-state",
  legendary: "ring-2 ring-tone-focus shadow-[0_0_12px_rgb(var(--t-focus-rgb)/0.45)]",
};

function ItemVisual({ item, playerName }: { item: InventoryItem; playerName: string }) {
  if (item.category === "avatar") {
    return <Avatar size="lg" name={playerName} source={item.avatarSource} />;
  }
  if (item.category === "frame") {
    return (
      <div className={cx("flex h-12 w-12 items-center justify-center rounded-sm bg-black/50", FRAME_PREVIEW_RING[item.rarity])}>
        <Icon name="user" size={24} className="text-tone-text/80" />
      </div>
    );
  }
  if (item.category === "title") {
    return (
      <span className="px-1 text-center font-heading text-xs font-bold leading-snug text-tone-focus">
        {item.titleText ?? item.name}
      </span>
    );
  }
  if (item.category === "bg") {
    const url = item.bgFile ? bgAssetUrl(item.bgFile) : undefined;
    return (
      <div
        className="h-14 w-full bg-black/60 bg-cover bg-center bevel-sunken-1"
        style={url ? { backgroundImage: `url("${url}")` } : undefined}
      />
    );
  }
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-black/50 text-tone-focus">
      <Icon name={item.chatIconName ?? "star"} size={24} />
    </div>
  );
}

/** T7 §3.6 — Tab Kho đồ (chỉ đồ trang trí, không mua bán). */
export function InventoryTab({
  profile,
  onEquip,
}: {
  profile: ProfileData;
  onEquip: (item: InventoryItem) => void;
}) {
  const idBase = useId();
  const [category, setCategory] = useState<ItemCategory>("avatar");
  const [selectedId, setSelectedId] = useState<string>(profile.equipped.avatar);

  const itemsInCategory = useMemo(
    () => profile.inventory.filter((it) => it.category === category),
    [profile.inventory, category],
  );

  const selectedItem =
    itemsInCategory.find((it) => it.id === selectedId) ??
    itemsInCategory.find((it) => it.id === profile.equipped[category]) ??
    itemsInCategory[0];

  // Preview values combining currently equipped items + the selected item
  const equippedItem = (cat: ItemCategory) =>
    profile.inventory.find((it) => it.id === profile.equipped[cat]);

  const previewAvatar =
    selectedItem?.category === "avatar"
      ? selectedItem.avatarSource
      : equippedItem("avatar")?.avatarSource ?? profile.player.avatar;

  const previewFrameRarity: ItemRarity =
    selectedItem?.category === "frame"
      ? selectedItem.rarity
      : equippedItem("frame")?.rarity ?? profile.frameRarity;

  const previewTitle =
    selectedItem?.category === "title"
      ? (selectedItem.titleText ?? selectedItem.name)
      : (equippedItem("title")?.titleText ?? profile.title);

  const previewBgFile =
    selectedItem?.category === "bg"
      ? (selectedItem.bgFile ?? profile.bannerBg)
      : (equippedItem("bg")?.bgFile ?? profile.bannerBg);
  const previewBgUrl = bgAssetUrl(previewBgFile);

  const previewChatIcon =
    selectedItem?.category === "chatIcon"
      ? (selectedItem.chatIconName ?? "star")
      : (equippedItem("chatIcon")?.chatIconName ?? "star");

  const sampleChatMessage: ChatMessageData = {
    id: "preview-msg",
    kind: "own",
    author: { ...profile.player, avatar: previewAvatar },
    text: "Vào phòng Random 4v4 đi anh em!",
    at: new Date().toISOString(),
  };

  const tabItems = CATEGORIES.map((cat) => {
    const list = profile.inventory.filter((it) => it.category === cat);
    const owned = list.filter((it) => it.owned).length;
    return {
      value: cat,
      label: `${ITEM_CATEGORY_LABELS[cat]} (${owned}/${list.length})`,
    };
  });

  const isEquipped = selectedItem ? profile.equipped[selectedItem.category] === selectedItem.id : false;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
      {/* Left: vertical categories */}
      <aside className="bg-black/35 p-2.5 bevel-sunken-1">
        <Tabs
          variant="vertical"
          label="Danh mục kho đồ"
          idBase={idBase}
          items={tabItems}
          value={category}
          onChange={(next) => {
            setCategory(next);
            setSelectedId(profile.equipped[next]);
          }}
        />
      </aside>

      {/* Center: item grid with rarity textures */}
      <TabPanel idBase={idBase} value={category} className="min-w-0">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {itemsInCategory.map((item) => {
            const equipped = profile.equipped[item.category] === item.id;
            const selected = selectedItem?.id === item.id;

            const card = (
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={cx(
                  "group relative flex w-full flex-col text-left transition-transform focus-visible:outline-game-out",
                  selected && "ring-2 ring-tone-state",
                )}
              >
                <Surface
                  texture={RARITY_TEXTURE[item.rarity]}
                  className={cx(
                    "relative flex h-32 w-full flex-col items-center justify-between p-2.5 bevel-raised-2",
                    item.rarity === "legendary" && "border-2 border-tone-focus",
                  )}
                >
                  <div className="flex w-full items-center justify-between text-xs">
                    <span className="rounded-sm bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-tone-text/90">
                      {RARITY_LABEL[item.rarity]}
                    </span>
                    {equipped && (
                      <span
                        title="Đang trang bị"
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-success-on-dark"
                      >
                        <Icon name="check" size={12} />
                      </span>
                    )}
                    {!item.owned && (
                      <span
                        title={item.source}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-tone-text/80"
                      >
                        <Icon name="lock" size={12} />
                      </span>
                    )}
                  </div>

                  <div className={cx("flex flex-1 items-center justify-center w-full", !item.owned && "opacity-45 grayscale")}>
                    <ItemVisual item={item} playerName={profile.player.name} />
                  </div>

                  <div className="w-full truncate text-center text-xs font-semibold text-tone-text">
                    {item.name}
                  </div>
                </Surface>
              </button>
            );

            return item.owned ? (
              <div key={item.id}>{card}</div>
            ) : (
              <Tooltip key={item.id} content={`Cách nhận: ${item.source}`}>
                <div>{card}</div>
              </Tooltip>
            );
          })}
        </div>
      </TabPanel>

      {/* Right: live preview + equip action */}
      {selectedItem && (
        <aside className="flex flex-col gap-3 bg-black/35 p-3 bevel-sunken-1">
          <div className="font-heading text-xs font-bold uppercase tracking-wider text-tone-state">
            Xem trước
          </div>

          {/* Mini profile header preview */}
          <div
            className="relative overflow-hidden bg-black/60 bg-cover bg-center p-3 bevel-raised-1"
            style={previewBgUrl ? { backgroundImage: `url("${previewBgUrl}")` } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/55" aria-hidden />
            <div className="relative z-10 flex items-center gap-3">
              <div className={cx("rounded-sm p-0.5", FRAME_PREVIEW_RING[previewFrameRarity])}>
                <Avatar size="lg" name={profile.player.name} source={previewAvatar} />
              </div>
              <div className="min-w-0">
                <div className="truncate font-heading text-md font-bold text-tone-focus">
                  {profile.player.name}
                </div>
                <div className="truncate text-xs text-tone-state">{previewTitle}</div>
              </div>
            </div>
          </div>

          {/* Sample ChatMessage preview */}
          <div className="bg-black/50 p-2 bevel-sunken-1">
            <div className="mb-1 flex items-center gap-1.5 px-2 text-xs text-tone-text/70">
              <Icon name={previewChatIcon} size={12} className="text-tone-focus" />
              <span>Mẫu khung chat</span>
            </div>
            <ChatMessage message={sampleChatMessage} avatarSize="xs" />
          </div>

          {/* Item metadata */}
          <div className="flex flex-col gap-1.5 bg-black/40 p-3 text-sm bevel-sunken-1">
            <div className="font-heading text-md font-bold text-tone-focus">{selectedItem.name}</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-tone-text/70">Độ hiếm</span>
              <span className="font-semibold text-tone-state">{RARITY_LABEL[selectedItem.rarity]}</span>
            </div>
            <div className="flex items-start justify-between gap-2 text-xs">
              <span className="shrink-0 text-tone-text/70">Nguồn nhận</span>
              <span className="text-right text-tone-text/90">{selectedItem.source}</span>
            </div>
          </div>

          {selectedItem.owned ? (
            <Button
              variant={isEquipped ? "secondary" : "primary"}
              disabled={isEquipped}
              onClick={() => onEquip(selectedItem)}
            >
              {isEquipped ? "Đang dùng" : "Trang bị"}
            </Button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Button variant="secondary" disabled icon={<Icon name="lock" size={16} />}>
                Chưa mở khóa
              </Button>
              <span className="text-center text-xs text-tone-text/70">
                Mở khóa qua: {selectedItem.source}
              </span>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

