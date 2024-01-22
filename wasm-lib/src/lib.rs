use wasm_bindgen::prelude::*;
use contour_tracing::array::bits_to_paths;

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    let bits = vec![
        vec![1, 1, 0],
        vec![1, 1, 1],
        vec![0, 1, 1],
    ];


    format!("Hello, {}!", bits_to_paths(bits, true))
}
