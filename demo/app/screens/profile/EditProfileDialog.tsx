import { useState } from "react";
import {
  Button, Checkbox, Dialog, FormField, GameIcon, Select, Textarea, Tooltip,
} from "../../../../components";
import { CIVS, type CivId } from "../../civs";
import type { ProfileData } from "../../profileMock";

const BIO_MAX = 200;
const MAX_PINNED = 3;

const CIV_OPTIONS: { value: CivId; label: string }[] = CIVS.map((c) => ({
  value: c.id,
  label: c.label,
}));

export function EditProfileDialog({
  profile,
  onSave,
  onClose,
}: {
  profile: ProfileData;
  onSave: (patch: { bio: string; favouriteCiv: CivId; pinnedIds: string[] }) => void;
  onClose: () => void;
}) {
  const [bio, setBio] = useState(profile.bio);
  const [favouriteCiv, setFavouriteCiv] = useState<CivId>(profile.favouriteCiv);
  const [pinnedIds, setPinnedIds] = useState<string[]>(profile.pinnedIds);

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PINNED) return prev;
      return [...prev, id];
    });
  };

  return (
    <Dialog
      title="Sửa hồ sơ"
      size="md"
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ bio: bio.trim(), favouriteCiv, pinnedIds });
      }}
      actions={
        <>
          <Button onClick={onClose}>Huỷ</Button>
          <Button type="submit" variant="primary">
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 bg-black/60 p-4 text-tone-text bevel-sunken">
        <FormField
          label="Giới thiệu"
          hint={`${bio.length}/${BIO_MAX} ký tự`}
        >
          <Textarea
            minRows={3}
            maxRows={5}
            maxLength={BIO_MAX}
            value={bio}
            placeholder="Viết vài dòng giới thiệu về bạn (đế chế, giờ hay online…)"
            onChange={(e) => setBio(e.target.value)}
          />
        </FormField>

        <FormField label="Đế chế yêu thích">
          <Select
            aria-label="Đế chế yêu thích"
            options={CIV_OPTIONS}
            value={favouriteCiv}
            onChange={setFavouriteCiv}
          />
        </FormField>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-heading text-sm font-semibold text-tone-state">
            <span>Ghim thành tựu trên đầu trang</span>
            <span className="font-body text-xs text-tone-text/75 tabular">
              {pinnedIds.length}/{MAX_PINNED}
            </span>
          </div>

          {profile.unlockedAchievements.length === 0 ? (
            <p className="m-0 font-body text-xs text-tone-text/60">
              Bạn chưa mở khoá thành tựu nào.
            </p>
          ) : (
            <div className="flex flex-col gap-1 bg-black/40 p-2 bevel-sunken-1">
              {profile.unlockedAchievements.map((ach) => {
                const checked = pinnedIds.includes(ach.id);
                const locked = !checked && pinnedIds.length >= MAX_PINNED;
                const row = (
                  <div
                    key={ach.id}
                    className={`flex items-center justify-between gap-2 px-1.5 py-1 ${
                      locked ? "opacity-55" : ""
                    }`}
                  >
                    <Checkbox
                      label={
                        <span className="inline-flex items-center gap-2">
                          <GameIcon set={ach.iconSet} frame={ach.frame} size={16} />
                          <span>{ach.name}</span>
                        </span>
                      }
                      checked={checked}
                      disabled={locked}
                      onChange={() => togglePin(ach.id)}
                    />
                  </div>
                );
                return locked ? (
                  <Tooltip key={ach.id} content="Đã ghim đủ 3 — bỏ ghim một cái trước">
                    <div>{row}</div>
                  </Tooltip>
                ) : (
                  row
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

