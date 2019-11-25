import SDateRangePicker from "../src/components/SDateRangePicker.svelte"
import { render } from "@testing-library/svelte"

describe("SDateRangePicker", () => {
	it("Should render greeting", () => {
		const { container } = render(SDateRangePicker, {
			props: {}
		})

		expect(container.querySelector("div")).toHaveTextContent("Hello world!")
	})
})
