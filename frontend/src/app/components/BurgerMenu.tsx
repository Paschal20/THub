import { HiMenuAlt3 } from "react-icons/hi";

interface BurgerMenuProps {
  toggle: () => void;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ toggle }) => {
  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-[60] p-2 rounded-md bg-white text-green-700 shadow-md border"
    >
      <HiMenuAlt3 size={26} />
    </button>
  );
};

export default BurgerMenu;
