/**
 * isEmail is a function that checks if a given email address is valid.
 * thus allowing to check if a text is a valid email address before using EmailCell.
 *
 * @param {string} value - The email address to check.
 * @returns {boolean} - True if the email address is valid, false otherwise.
 */
export const isEmail = ({ value }: { value: string }): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * EmailCell is a component that displays an email address.
 *
 * It should allow the user to click on the email address to open the email client.
 *
 * @param {string} value - The email address to display.
 * @returns {React.ReactNode} - The email address or a placeholder if the email address is not valid.
 */
export function EmailCell({ value }: { value: string }) {
  return (
    <span
      className="cursor-pointer hover:underline"
      onClick={() => window.open(`mailto:${value}`, "_blank")}
    >
      {value}
    </span>
  )
}
