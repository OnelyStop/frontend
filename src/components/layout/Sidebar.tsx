import { MessageSquarePlus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { NAV_GROUPS } from "../../data/navigation";
import { Badge } from "../ui/Badge";
import { NavIcon } from "../ui/NavIcon";
import "./Sidebar.css";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: Props) {
  const { markerLabel } = useApp();

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden>
          <span />
          <span />
        </div>
        {!collapsed && <span className="sidebar__name">onelystopp</span>}
        <button
          type="button"
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} strokeWidth={1.75} />
          ) : (
            <PanelLeftClose size={16} strokeWidth={1.75} />
          )}
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="sidebar__group">
            {!collapsed && (
              <div className="sidebar__group-label">{group.label}</div>
            )}
            <ul className="sidebar__list">
              {group.items.map((item) => {
                const label = item.dynamicLabel ? markerLabel : item.label;
                return (
                  <li key={item.id}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      title={collapsed ? label : undefined}
                      className={({ isActive }) =>
                        `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                      }
                    >
                      <NavIcon name={item.icon} />
                      {!collapsed && (
                        <>
                          <span className="sidebar__link-text">{label}</span>
                          {item.badge === "NEW" && <Badge>New</Badge>}
                          {item.badge === "BETA" && (
                            <Badge tone="grey">Beta</Badge>
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

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__feedback"
          title={collapsed ? "Leave feedback" : undefined}
        >
          <MessageSquarePlus size={16} strokeWidth={1.75} />
          {!collapsed && <span>Leave feedback</span>}
        </button>
      </div>
    </aside>
  );
}
