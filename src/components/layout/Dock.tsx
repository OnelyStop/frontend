import { useState } from "react";
import { MessageSquarePlus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { NAV_GROUPS } from "../../data/navigation";
import { Badge } from "../ui/Badge";
import { NavIcon } from "../ui/NavIcon";
import { GradeRail } from "./GradeRail";
import "./Dock.css";

type Props = {
  pinned: boolean;
  onTogglePin: () => void;
};

// Floating glass dock — onelystopp's take on navigation. Rests as an icon
// rail and expands over the content on hover/focus; pinning it open shifts
// the content aside instead.
export function Dock({ pinned, onTogglePin }: Props) {
  const { markerLabel, mastery } = useApp();
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
        <div className="dock__logo" aria-hidden>
          <span />
          <span />
        </div>
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
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      title={expanded ? undefined : label}
                      className={({ isActive }) =>
                        `dock__link ${isActive ? "dock__link--active" : ""}`
                      }
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
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
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
