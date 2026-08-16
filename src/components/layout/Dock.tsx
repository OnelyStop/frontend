"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NAV_GROUPS } from "@/data/navigation";
import { Badge } from "@/components/ui/Badge";
import { NavIcon } from "../ui/NavIcon";
import { LogoMark } from "@/components/ui/Logo";
import { GradeRail } from "./GradeRail";
import "./Dock.css";

type Props = {
  pinned: boolean;
  isAdmin: boolean;
  onTogglePin: () => void;
};

// Hover expands over the content; pinning shifts the content aside instead.
export function Dock({ pinned, isAdmin, onTogglePin }: Props) {
  const { markerLabel, mastery } = useApp();
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const expanded = pinned || hovered;

  return (
    <aside
      className={`dock ${expanded ? "dock--expanded" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false);
      }}
    >
      <div className="dock__brand">
        <LogoMark />
        {expanded && (
          <>
            <span className="dock__name">onelystopp</span>
            <button
              type="button"
              className="dock__pin"
              onClick={onTogglePin}
              aria-label={pinned ? "Unpin dock" : "Pin dock open"}
              title={pinned ? "Unpin dock" : "Pin dock open"}
            >
              {pinned ? (
                <PanelLeftClose size={16} strokeWidth={1.75} />
              ) : (
                <PanelLeftOpen size={16} strokeWidth={1.75} />
              )}
            </button>
          </>
        )}
      </div>

      <GradeRail collapsed={!expanded} />

      {/* data-lenis-prevent keeps the dock's internal scroll native */}
      <nav className="dock__nav" data-lenis-prevent>
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.id} className="dock__group">
            {expanded ? (
              <div className="dock__group-label">{group.label}</div>
            ) : (
              groupIndex > 0 && <div className="dock__divider" aria-hidden />
            )}
            <ul className="dock__list">
              {group.items.map((item) => {
                const label = item.dynamicLabel ? markerLabel : item.label;
                const itemMastery = mastery[item.id];
                return (
                  <li key={item.id}>
                    <Link
                      href={item.path}
                      title={expanded ? undefined : label}
                      className={`dock__link ${
                        pathname === item.path ? "dock__link--active" : ""
                      }`}
                    >
                      <NavIcon name={item.icon} />
                      {expanded && (
                        <>
                          <span className="dock__link-text">{label}</span>
                          {item.badge === "NEW" && <Badge>New</Badge>}
                          {item.badge === "BETA" && (
                            <Badge tone="grey">Beta</Badge>
                          )}
                          {!item.badge && itemMastery !== undefined && (
                            <span
                              className="dock__mastery"
                              title={`${itemMastery}% mastered`}
                            >
                              <span
                                className="dock__mastery-fill"
                                style={{ width: `${itemMastery}%` }}
                              />
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {isAdmin && (
          <div className="dock__group">
            {expanded ? (
              <div className="dock__group-label">Admin</div>
            ) : (
              <div className="dock__divider" aria-hidden />
            )}
            <ul className="dock__list">
              <li>
                <Link
                  href="/admin"
                  title={expanded ? undefined : "Admin"}
                  className={`dock__link ${
                    pathname.startsWith("/admin") ? "dock__link--active" : ""
                  }`}
                >
                  <NavIcon name="settings" />
                  {expanded && <span className="dock__link-text">Admin</span>}
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>

      <div className="dock__footer">
        <button
          type="button"
          className="dock__feedback"
          title={expanded ? undefined : "Leave feedback"}
        >
          <MessageSquarePlus size={16} strokeWidth={1.75} />
          {expanded && <span>Leave feedback</span>}
        </button>
      </div>
    </aside>
  );
}
