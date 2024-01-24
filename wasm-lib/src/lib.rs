use wasm_bindgen::prelude::*;
use contour_tracing::array::bits_to_paths;

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(width: usize, height: i32, data: &[u8]) -> String {
    // let bits = vec![
    //     vec![1, 1, 1, 1, 1, 1],
    //     vec![1, 0, 1, 0, 0, 1],
    //     vec![1, 0, 1, 0, 0, 1],
    //     vec![1, 0, 1, 0, 0, 1],
    //     vec![1, 1, 1, 1, 1, 1],
    // ];
    let bits = data
        .iter()
        .step_by(4)
        .cloned()
        .collect::<Vec<_>>()
        // 4 colors
        .chunks(width)
        .map(|chunk| chunk.iter().map(|&b| if b > 128 { 1i8 } else { 0i8 }).collect())
        .collect();

    bits_to_paths(bits, true)
}
