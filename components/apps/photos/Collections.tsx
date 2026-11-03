"use client";

import { albums, HIDDEN_ID, hiddenAlbums, people, portrait, screenshots, years, type Album } from "./data";
import { ChevronRight, LockIcon, PersonIcon, ScreenshotIcon } from "./icons";
import { HEADER, LargeTitle, SectionHeader, plural } from "./ui";

type Props = { width: number; left: number; onAlbum: (id: string) => void };

// Collections: the iOS 26 tab of carousels (Pinned, Albums, days, People)
// over grouped lists for Media Types and Utilities.
export default function Collections({ width, left, onAlbum }: Props) {
  const compact = width < 600;
  const card = compact ? 136 : 158;

  return (
    <div className="absolute inset-y-0" style={{ left, width }}>
      <div data-scroll className="h-full overflow-y-auto overscroll-contain no-scrollbar">
        <div className="pb-[48px]" style={{ paddingTop: HEADER + 8 }}>
          <SectionHeader title="Pinned" />
          <Row>
            <Card album={screenshots} size={card} onClick={onAlbum} />
            <Card album={people} size={card} onClick={onAlbum} round />
          </Row>

          <SectionHeader title="Albums" />
          <Row>
            {albums.map((a) => (
              <Card key={a.id} album={a} size={card} onClick={onAlbum} />
            ))}
          </Row>

          <SectionHeader title="Years" />
          <Row>
            {years.map((a) => (
              <DayCard key={a.id} album={a} width={compact ? 250 : 300} onClick={onAlbum} />
            ))}
          </Row>

          <SectionHeader title="People" />
          <Row>
            <button type="button" onClick={() => onAlbum(people.id)} className="group flex w-[96px] flex-col items-center gap-[8px]">
              <span className="relative size-[96px] overflow-hidden rounded-full" style={{ background: portrait.backdrop }}>
                <img src={portrait.src} alt="" loading="lazy" decoding="async" className="absolute top-[6px] left-1/2 w-[120%] max-w-none -translate-x-1/2 transition-transform duration-500 group-hover:scale-105" />
              </span>
              <span className="text-[13px] leading-[16px] font-semibold text-label">{people.title.split(" ")[0]}</span>
            </button>
          </Row>

          <SectionHeader title="Media Types" />
          <List>
            <ListRow icon={<ScreenshotIcon size={22} />} title="Screenshots" detail={String(screenshots.photos.length)} onClick={() => onAlbum(screenshots.id)} />
            <ListRow icon={<PersonIcon size={22} />} title="Portraits" detail={String(people.photos.length)} onClick={() => onAlbum(people.id)} />
          </List>

          <SectionHeader title="Utilities" />
          <List>
            <ListRow
              icon={<LockIcon size={20} />}
              title="Hidden"
              detail={<LockIcon size={14} className="text-label-3" />}
              onClick={() => onAlbum(HIDDEN_ID)}
              hint={plural(hiddenAlbums.length, "confidential project")}
            />
          </List>
        </div>
      </div>

      <LargeTitle
        title="Collections"
        width={width}
        right={
          <button
            type="button"
            aria-label={people.title}
            onClick={() => onAlbum(people.id)}
            className="glass relative size-[40px] overflow-hidden rounded-full"
            style={{ background: portrait.backdrop }}
          >
            <img src={portrait.src} alt="" className="absolute top-[3px] left-1/2 w-[130%] max-w-none -translate-x-1/2" />
          </button>
        }
      />
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="no-scrollbar mb-[26px] flex snap-x gap-[12px] overflow-x-auto overscroll-x-contain px-[18px] scroll-px-[18px]">{children}</div>;
}

function Card({ album, size, onClick, round }: { album: Album; size: number; onClick: (id: string) => void; round?: boolean }) {
  const cover = album.photos[0]!;
  return (
    <button type="button" onClick={() => onClick(album.id)} className="group shrink-0 snap-start text-left" style={{ width: size }}>
      <span
        className="relative block overflow-hidden rounded-[18px] bg-fill-3"
        style={{ width: size, height: size, background: cover.backdrop }}
      >
        <img
          src={cover.thumb}
          alt=""
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 size-full transition-transform duration-500 group-hover:scale-[1.04] ${round ? "top-[8%] object-contain object-bottom" : "object-cover"}`}
        />
      </span>
      <span className="mt-[7px] block truncate text-[15px] leading-[19px] font-semibold tracking-[-0.02em] text-label">{album.title}</span>
      <span className="block text-[13px] leading-[17px] text-label-2">{album.photos.length}</span>
    </button>
  );
}

/** Like Recent Days: the label sits on the photo. */
function DayCard({ album, width, onClick }: { album: Album; width: number; onClick: (id: string) => void }) {
  const cover = album.photos[0]!;
  return (
    <button
      type="button"
      onClick={() => onClick(album.id)}
      className="group relative shrink-0 snap-start overflow-hidden rounded-[18px] bg-fill-3 text-left"
      style={{ width, height: Math.round(width * 0.66) }}
    >
      <img src={cover.thumb} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
      <span className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
      <span className="absolute right-[14px] bottom-[12px] left-[14px] text-white">
        <span className="block font-display text-[24px] leading-[28px] font-bold">{album.title}</span>
        <span className="block truncate text-[13px] leading-[17px] font-medium opacity-85">
          {album.sub} · {album.photos.length}
        </span>
      </span>
    </button>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <div className="mx-[18px] mb-[26px] overflow-hidden rounded-[22px] bg-fill-3">{children}</div>;
}

function ListRow({
  icon,
  title,
  detail,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  detail: React.ReactNode;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="group flex min-h-[50px] w-full items-center gap-[12px] pl-[16px] text-left transition-colors hover:bg-fill-3">
      <span className="grid w-[26px] place-items-center text-blue">{icon}</span>
      <span className="flex min-h-[50px] flex-1 items-center gap-[8px] border-b border-sep pr-[14px] group-last:border-b-0">
        <span className="flex-1">
          <span className="block text-[17px] leading-[22px] tracking-[-0.02em] text-label">{title}</span>
          {hint ? <span className="block text-[12px] leading-[15px] text-label-2">{hint}</span> : null}
        </span>
        <span className="text-[17px] text-label-2">{detail}</span>
        <ChevronRight size={14} className="text-label-3" />
      </span>
    </button>
  );
}
