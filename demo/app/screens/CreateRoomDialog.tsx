import { useRef, useState } from "react";
import { Button, Dialog, FormField, Input, Select } from "../../../components";
import type { LobbyRoom } from "../lobbyMock";

type Category = LobbyRoom["category"];

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "random", label: "Random" },
  { value: "cungr", label: "Cung R" },
  { value: "clan", label: "Clan Rooms" },
];

const NAME_MAX = 40;

export interface CreateRoomInput {
  name: string;
  password: string;
  category: Category;
}

/**
 * "Tạo phòng": room name (required; prefilled with a default name, selected as a whole on focus so typing
 * replaces it), optional password (empty = open room) and category, preset to the category tab the lobby is
 * showing. Mount it only while open so every opening starts from a clean form.
 */
export function CreateRoomDialog({
  defaultName,
  defaultCategory,
  onCreate,
  onClose,
}: {
  /** e.g. "Phòng của lan_hylap". */
  defaultName: string;
  defaultCategory: Category;
  onCreate: (input: CreateRoomInput) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [tried, setTried] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const trimmed = name.trim();
  const nameError = !tried
    ? undefined
    : !trimmed
      ? "Nhập tên phòng."
      : undefined;

  return (
    <Dialog
      title="Tạo phòng"
      size="sm"
      onClose={onClose}
      initialFocus={nameRef}
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (!trimmed) {
          nameRef.current?.focus();
          return;
        }
        onCreate({ name: trimmed, password, category });
      }}
      actions={
        <>
          <Button onClick={onClose}>Huỷ</Button>
          <Button type="submit" variant="primary">
            Tạo phòng
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1">
        <FormField
          label="Tên phòng"
          required
          error={nameError}
          hint={`Tối đa ${NAME_MAX} ký tự.`}
        >
          <Input
            ref={nameRef}
            maxLength={NAME_MAX}
            autoComplete="off"
            placeholder="vd: 4v4 vào là chơi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            // Keep the select-all from focus (the mouse-up of the same click would collapse it).
            onMouseUp={(e) => e.preventDefault()}
          />
        </FormField>
        <FormField label="Mật khẩu" hint="Để trống nếu không cần.">
          <Input
            type="password"
            autoComplete="new-password"
            maxLength={20}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        <FormField label="Thể loại">
          <Select
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={setCategory}
          />
        </FormField>
      </div>
    </Dialog>
  );
}
