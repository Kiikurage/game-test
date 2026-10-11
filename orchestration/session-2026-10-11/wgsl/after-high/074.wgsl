// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform0_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform8_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform8 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform21_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform21 : texture_depth_2d;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform2 : f32,
	nodeUniform3 : f32,
	nodeUniform5 : mat3x3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	nodeUniform7 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform9 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform27 : f32,
	nodeUniform28 : f32,
	nodeUniform12 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform18 : mat4x4<f32>,
	nodeUniform19 : f32,
	nodeUniform20 : f32,
	nodeUniform24 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : u32;
var<private> nodeVar3 : u32;
var<private> nodeVar4 : u32;
var<private> nodeVar5 : u32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : u32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : vec3<f32>;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : vec2<f32>;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : vec3<f32>;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : vec2<f32>;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : u32;
var<private> nodeVar24 : u32;
var<private> nodeVar25 : u32;
var<private> nodeVar26 : u32;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : vec2<f32>;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : vec2<f32>;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : vec2<f32>;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : vec2<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : vec2<f32>;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : vec2<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : vec2<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : vec2<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : vec2<f32>;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : u32;
var<private> nodeVar75 : u32;
var<private> nodeVar76 : u32;
var<private> nodeVar77 : u32;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar88 : vec3<f32>;
var<private> NORMAL_nodeVar89 : f32;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : vec2<f32>;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : vec2<f32>;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec4<f32>;
var<private> nodeVar125 : vec4<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : f32;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : f32;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec4<f32>;
var<private> nodeVar153 : vec4<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : vec4<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : f32;
var<private> nodeVar162 : f32;
var<private> nodeVar163 : vec2<f32>;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : vec2<f32>;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : vec2<f32>;
var<private> nodeVar168 : f32;
var<private> nodeVar169 : vec2<f32>;
var<private> nodeVar170 : f32;
var<private> nodeVar171 : vec2<f32>;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : f32;
var<private> nodeVar181 : f32;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : f32;
var<private> nodeVar190 : f32;
var<private> nodeVar191 : f32;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : f32;
var<private> nodeVar199 : f32;
var<private> nodeVar200 : f32;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : f32;
var<private> nodeVar211 : f32;
var<private> nodeVar212 : f32;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : f32;
var<private> nodeVar220 : f32;
var<private> nodeVar221 : f32;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : f32;
var<private> nodeVar238 : f32;
var<private> nodeVar239 : f32;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : f32;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> nodeVar259 : vec3<f32>;
var<private> nodeVar260 : vec3<f32>;
var<private> nodeVar261 : vec3<f32>;
var<private> nodeVar262 : vec3<f32>;
var<private> nodeVar263 : f32;
var<private> nodeVar264 : f32;
var<private> nodeVar265 : f32;
var<private> nodeVar266 : vec3<f32>;
var<private> nodeVar267 : vec3<f32>;
var<private> nodeVar268 : vec3<f32>;
var<private> nodeVar269 : vec3<f32>;
var<private> nodeVar270 : vec3<f32>;
var<private> nodeVar271 : vec3<f32>;
var<private> nodeVar272 : vec3<f32>;
var<private> nodeVar273 : f32;
var<private> nodeVar274 : vec3<f32>;
var<private> nodeVar275 : vec3<f32>;
var<private> nodeVar276 : vec3<f32>;
var<private> nodeVar277 : vec3<f32>;
var<private> nodeVar278 : vec3<f32>;
var<private> nodeVar279 : vec3<f32>;
var<private> nodeVar280 : vec3<f32>;
var<private> nodeVar281 : f32;
var<private> nodeVar282 : f32;
var<private> nodeVar283 : f32;
var<private> nodeVar284 : vec3<f32>;
var<private> nodeVar285 : vec3<f32>;
var<private> nodeVar286 : vec3<f32>;
var<private> nodeVar287 : vec3<f32>;
var<private> nodeVar288 : vec3<f32>;
var<private> nodeVar289 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar290 : vec3<f32>;
var<private> nodeVar291 : vec3<f32>;
var<private> nodeVar292 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar293 : vec3<f32>;
var<private> nodeVar294 : vec3<f32>;
var<private> nodeVar295 : vec3<f32>;
var<private> nodeVar296 : vec3<f32>;
var<private> nodeVar297 : vec3<f32>;
var<private> nodeVar298 : vec3<f32>;
var<private> nodeVar299 : vec3<f32>;
var<private> nodeVar300 : vec3<f32>;
var<private> nodeVar301 : vec3<f32>;
var<private> nodeVar302 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar303 : vec3<f32>;
var<private> nodeVar304 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar305 : vec3<f32>;
var<private> nodeVar306 : f32;
var<private> nodeVar307 : f32;
var<private> nodeVar308 : f32;
var<private> nodeVar309 : f32;
var<private> nodeVar310 : f32;
var<private> nodeVar311 : f32;
var<private> nodeVar312 : f32;
var<private> nodeVar313 : f32;
var<private> nodeVar314 : f32;
var<private> nodeVar315 : f32;
var<private> nodeVar316 : f32;
var<private> nodeVar317 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar318 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar319 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar320 : vec3<f32>;
var<private> nodeVar321 : f32;
var<private> nodeVar322 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : f32,
	@location( 5 ) nodeVarying8 : f32,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = ( nodeVarying7 / 0.84 );
	nodeVar1 = floor( nodeVar0 );
	nodeVar2 = ( ( u32( ( ( nodeVar1 * 1.9 ) + 13.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar3 = ( ( ( nodeVar2 >> ( ( nodeVar2 >> 28u ) + 4u ) ) ^ nodeVar2 ) * 277803737u );
	nodeVar4 = ( ( u32( ( nodeVar1 + 5.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar5 = ( ( ( nodeVar4 >> ( ( nodeVar4 >> 28u ) + 4u ) ) ^ nodeVar4 ) * 277803737u );
	nodeVar6 = ( 1000.0 * ( ( ( f32( ( ( nodeVar5 >> 22u ) ^ nodeVar5 ) ) * 2.3283064365386963e-10 ) * 0.5 ) + 0.78 ) );
	nodeVar7 = ( ( nodeVarying8 + ( ( f32( ( ( nodeVar3 >> 22u ) ^ nodeVar3 ) ) * 2.3283064365386963e-10 ) * nodeVar6 ) ) / nodeVar6 );
	nodeVar8 = ( ( u32( ( ( nodeVar1 * 91.7 ) + floor( nodeVar7 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar9 = ( ( ( nodeVar8 >> ( ( nodeVar8 >> 28u ) + 4u ) ) ^ nodeVar8 ) * 277803737u );
	nodeVar10 = ( f32( ( ( nodeVar9 >> 22u ) ^ nodeVar9 ) ) * 2.3283064365386963e-10 );
	nodeVar11 = fract( ( ( ( v_positionWorld * vec3<f32>( 2.4 ) ) + vec3<f32>( nodeVar10 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar12 = ( nodeVar11.z * 64.0 );
	nodeVar13 = floor( nodeVar12 );
	nodeVar14 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar13, 8.0 ), floor( ( nodeVar13 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar11.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar15 = ( v_positionWorld.y - 9.9 );
	nodeVar16 = fract( ( vec3<f32>( ( nodeVarying8 * 2.1 ), ( nodeVarying7 * 0.25 ), 3.3 ) / vec3<f32>( 8.0 ) ) );
	nodeVar17 = ( nodeVar16.z * 64.0 );
	nodeVar18 = floor( nodeVar17 );
	nodeVar19 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar18, 8.0 ), floor( ( nodeVar18 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar16.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar20 = ( max( ( ( 1.0 - smoothstep( 0.1, 1.5, nodeVar15 ) ) * 0.95 ), ( ( ( mix( nodeVar19.x, nodeVar19.y, ( nodeVar17 - nodeVar18 ) ) * 0.5 ) + 0.5 ) * 0.38 ) ) * 1.0 );
	nodeVar21 = ( smoothstep( 0.0, 0.5, ( ( mix( nodeVar14.x, nodeVar14.y, ( nodeVar12 - nodeVar13 ) ) + ( nodeVar20 * 0.9 ) ) - 0.15 ) ) * nodeVar20 );
	nodeVar22 = mix( 0.62, 1.0, smoothstep( 0.0, 0.7, nodeVar15 ) );
	nodeVar23 = ( ( u32( ( nodeVar10 + 17.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar24 = ( ( ( nodeVar23 >> ( ( nodeVar23 >> 28u ) + 4u ) ) ^ nodeVar23 ) * 277803737u );
	nodeVar25 = ( ( u32( nodeVar10 ) * 747796405u ) + 2891336453u );
	nodeVar26 = ( ( ( nodeVar25 >> ( ( nodeVar25 >> 28u ) + 4u ) ) ^ nodeVar25 ) * 277803737u );
	nodeVar27 = fract( ( ( ( v_positionWorld * vec3<f32>( 0.85 ) ) + vec3<f32>( ( nodeVar10 * 1.7 ) ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar28 = ( nodeVar27.z * 64.0 );
	nodeVar29 = floor( nodeVar28 );
	nodeVar30 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar29, 8.0 ), floor( ( nodeVar29 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar27.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar31 = ( ( mix( nodeVar30.x, nodeVar30.y, ( nodeVar28 - nodeVar29 ) ) * 0.5 ) + 0.5 );
	nodeVar32 = fract( ( ( v_positionWorld * vec3<f32>( 23.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar33 = ( nodeVar32.z * 64.0 );
	nodeVar34 = floor( nodeVar33 );
	nodeVar35 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar34, 8.0 ), floor( ( nodeVar34 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar32.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar36 = fract( nodeVar0 );
	nodeVar37 = fract( nodeVar7 );
	nodeVar38 = min( ( min( nodeVar36, ( 1.0 - nodeVar36 ) ) * 0.84 ), ( min( nodeVar37, ( 1.0 - nodeVar37 ) ) * nodeVar6 ) );
	nodeVar39 = ( fwidth( nodeVar38 ) + 0.0015 );
	nodeVar40 = ( 1.0 - smoothstep( 0.012, 0.05, nodeVar39 ) );
	nodeVar41 = ( mix( nodeVar35.x, nodeVar35.y, ( nodeVar33 - nodeVar34 ) ) * nodeVar40 );
	nodeVar42 = fract( ( ( ( v_positionWorld * vec3<f32>( 8.1 ) ) + vec3<f32>( nodeVar10 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar43 = ( nodeVar42.z * 64.0 );
	nodeVar44 = floor( nodeVar43 );
	nodeVar45 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar44, 8.0 ), floor( ( nodeVar44 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar42.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar46 = ( smoothstep( 0.52, 0.74, mix( nodeVar45.x, nodeVar45.y, ( nodeVar43 - nodeVar44 ) ) ) * nodeVar40 );
	nodeVar47 = fract( ( ( v_positionWorld * vec3<f32>( 9.5 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar48 = ( nodeVar47.z * 64.0 );
	nodeVar49 = floor( nodeVar48 );
	nodeVar50 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar49, 8.0 ), floor( ( nodeVar49 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar47.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar51 = fract( ( ( v_positionWorld * vec3<f32>( 31.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar52 = ( nodeVar51.z * 64.0 );
	nodeVar53 = floor( nodeVar52 );
	nodeVar54 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar53, 8.0 ), floor( ( nodeVar53 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar51.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar55 = ( ( nodeVar38 + ( mix( nodeVar50.x, nodeVar50.y, ( nodeVar48 - nodeVar49 ) ) * 0.014 ) ) + ( ( mix( nodeVar54.x, nodeVar54.y, ( nodeVar52 - nodeVar53 ) ) * 0.005 ) * nodeVar40 ) );
	nodeVar56 = ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( ( nodeVar10 * 3.1 ) ) );
	nodeVar57 = fract( ( ( nodeVar56 * vec3<f32>( 2.9 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar58 = ( nodeVar57.z * 64.0 );
	nodeVar59 = floor( nodeVar58 );
	nodeVar60 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar59, 8.0 ), floor( ( nodeVar59 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar57.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar61 = fract( ( ( ( nodeVar56 * vec3<f32>( 2.9 ) ) + vec3<f32>( 7.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar62 = ( nodeVar61.z * 64.0 );
	nodeVar63 = floor( nodeVar62 );
	nodeVar64 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar63, 8.0 ), floor( ( nodeVar63 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar61.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar65 = fract( ( ( ( nodeVar56 * vec3<f32>( 2.9 ) ) + vec3<f32>( 13.1 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar66 = ( nodeVar65.z * 64.0 );
	nodeVar67 = floor( nodeVar66 );
	nodeVar68 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar67, 8.0 ), floor( ( nodeVar67 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar65.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar69 = fract( ( ( nodeVar56 + ( vec3<f32>( mix( nodeVar60.x, nodeVar60.y, ( nodeVar58 - nodeVar59 ) ), mix( nodeVar64.x, nodeVar64.y, ( nodeVar62 - nodeVar63 ) ), mix( nodeVar68.x, nodeVar68.y, ( nodeVar66 - nodeVar67 ) ) ) * vec3<f32>( 0.4 ) ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar70 = ( nodeVar69.z * 64.0 );
	nodeVar71 = floor( nodeVar70 );
	nodeVar72 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar71, 8.0 ), floor( ( nodeVar71 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar69.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar73 = abs( mix( nodeVar72.x, nodeVar72.y, ( nodeVar70 - nodeVar71 ) ) );
	nodeVar74 = ( ( u32( ( nodeVar10 + 3.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar75 = ( ( ( nodeVar74 >> ( ( nodeVar74 >> 28u ) + 4u ) ) ^ nodeVar74 ) * 277803737u );
	nodeVar76 = ( ( u32( ( nodeVar10 + 9.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar77 = ( ( ( nodeVar76 >> ( ( nodeVar76 >> 28u ) + 4u ) ) ^ nodeVar76 ) * 277803737u );
	nodeVar78 = ( 0.022 + ( ( f32( ( ( nodeVar77 >> 22u ) ^ nodeVar77 ) ) * 2.3283064365386963e-10 ) * 0.012 ) );
	nodeVar79 = smoothstep( ( nodeVar78 - ( nodeVar39 * 0.9 ) ), ( nodeVar78 + ( nodeVar39 * 0.9 ) ), nodeVar55 );
	nodeVar80 = max( ( ( ( 1.0 - smoothstep( 0.016, ( ( ( fwidth( nodeVar73 ) + 0.002 ) * 1.6 ) + 0.016 ), nodeVar73 ) ) * step( 0.615, ( f32( ( ( nodeVar75 >> 22u ) ^ nodeVar75 ) ) * 2.3283064365386963e-10 ) ) ) * nodeVar79 ), ( ( ( ( 1.0 - smoothstep( 0.012, ( 0.012 + ( ( fwidth( 1.0 ) + 0.0015 ) * 1.6 ) ), 1.0 ) ) * 0.0 ) * 0.0 ) * nodeVar79 ) );
	nodeVar81 = ( ( ( ( ( ( ( ( vec3<f32>( 0.215, 0.205, 0.192 ) * mix( vec3<f32>( 0.83, 0.92, 1.05 ), vec3<f32>( 1.07, 0.97, 0.8 ), ( f32( ( ( nodeVar24 >> 22u ) ^ nodeVar24 ) ) * 2.3283064365386963e-10 ) ) ) * vec3<f32>( ( 0.5 + ( ( f32( ( ( nodeVar26 >> 22u ) ^ nodeVar26 ) ) * 2.3283064365386963e-10 ) * 0.85 ) ) ) ) * vec3<f32>( mix( 0.74, 1.14, nodeVar31 ) ) ) * vec3<f32>( ( 1.0 + ( nodeVar41 * 0.15 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar46 * 0.3 ) ) ) ) * vec3<f32>( mix( 0.68, 1.0, smoothstep( 0.0, 0.17, nodeVar55 ) ) ) ) * vec3<f32>( ( 1.0 + ( ( smoothstep( 0.02, 0.05, nodeVar55 ) * ( 1.0 - smoothstep( 0.05, 0.11, nodeVar55 ) ) ) * 0.14 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar80 * 0.78 ) ) ) );
	nodeVar82 = mix( ( mix( vec3<f32>( 0.045, 0.041, 0.038 ), vec3<f32>( 0.07, 0.092, 0.04 ), ( nodeVar21 * 0.9 ) ) * vec3<f32>( nodeVar22 ) ), ( ( mix( nodeVar81, ( nodeVar81 * vec3<f32>( 0.62, 0.78, 0.5 ) ), ( nodeVar21 * 0.7 ) ) * vec3<f32>( ( 1.0 - ( nodeVar20 * 0.38 ) ) ) ) * vec3<f32>( nodeVar22 ) ), nodeVar79 );
	DiffuseColor = vec4<f32>( nodeVar82, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform3;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar83 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 1.0, ( ( 0.93 - ( nodeVar31 * 0.1 ) ) + ( nodeVar21 * 0.07 ) ), nodeVar79 ), 0.0525 ) + max( max( nodeVar83.x, nodeVar83.y ), nodeVar83.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform3 ) ) );
	nodeVar84 = ( vec3<f32>( 115.88471875080587, 12.15, 71.23640507046963 ) - v_positionWorld );
	nodeVar85 = ( length( nodeVar84 ) / 4.4 );
	nodeVar86 = dpdx( v_positionView );
	nodeVar87 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar88 = cross( nodeVar87, NORMAL_normalView );
	NORMAL_nodeVar89 = dot( nodeVar86, NORMAL_nodeVar88 );
	nodeVar90 = fract( ( ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( nodeVar10 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar91 = ( nodeVar90.z * 64.0 );
	nodeVar92 = floor( nodeVar91 );
	nodeVar93 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar92, 8.0 ), floor( ( nodeVar92 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar90.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar94 = ( ( ( ( ( nodeVar79 * 0.014 ) - ( nodeVar46 * 0.004 ) ) - ( nodeVar80 * 0.006 ) ) + ( nodeVar41 * 0.0018 ) ) + ( mix( nodeVar93.x, nodeVar93.y, ( nodeVar91 - nodeVar92 ) ) * 0.004 ) );
	nodeVar95 = ( vec3<f32>( sign( NORMAL_nodeVar89 ) ) * ( ( ( vec3<f32>( dpdx( nodeVar94 ) ) * NORMAL_nodeVar88 ) + ( vec3<f32>( - dpdy( nodeVar94 ) ) * cross( NORMAL_normalView, nodeVar86 ) ) ) * vec3<f32>( 1.0 ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar89 ) ) * NORMAL_normalView ) - nodeVar95 ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar96 = ( vec3<f32>( 128.11528124919414, 12.15, 71.23640507046964 ) - v_positionWorld );
	nodeVar97 = ( length( nodeVar96 ) / 4.4 );
	nodeVar98 = ( vec3<f32>( 136.76359492953037, 12.15, 79.88471875080587 ) - v_positionWorld );
	nodeVar99 = ( length( nodeVar98 ) / 4.4 );
	nodeVar100 = ( vec3<f32>( 136.76359492953037, 12.15, 92.11528124919414 ) - v_positionWorld );
	nodeVar101 = ( length( nodeVar100 ) / 4.4 );
	nodeVar102 = ( vec3<f32>( 128.11528124919414, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar103 = ( length( nodeVar102 ) / 4.4 );
	nodeVar104 = ( vec3<f32>( 115.88471875080586, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar105 = ( length( nodeVar104 ) / 4.4 );
	nodeVar106 = ( vec3<f32>( 107.23640507046963, 12.15, 92.11528124919413 ) - v_positionWorld );
	nodeVar107 = ( length( nodeVar106 ) / 4.4 );
	nodeVar108 = ( vec3<f32>( 107.23640507046963, 12.15, 79.88471875080586 ) - v_positionWorld );
	nodeVar109 = ( length( nodeVar108 ) / 4.4 );
	EmissiveColor = ( nodeVar82 * ( ( vec3<f32>( 1.0, 0.52, 0.2 ) * ( ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar85 * nodeVar85 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar84 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 0.0 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 0.0 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 0.0 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar97 * nodeVar97 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar96 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 2.399 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 4.0783 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 7.4369000000000005 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar99 * nodeVar99 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar98 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 4.798 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 8.1566 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 14.873800000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar101 * nodeVar101 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar100 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 7.197 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 12.2349 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 22.3107 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar103 * nodeVar103 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar102 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 9.596 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 16.3132 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 29.747600000000002 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar105 * nodeVar105 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar104 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 11.995000000000001 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 20.3915 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 37.18450000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar107 * nodeVar107 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar106 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 14.394 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 24.4698 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 44.6214 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar109 * nodeVar109 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar108 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 16.793 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 28.548099999999998 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 52.0583 ) ) * 0.03 ) ) ) ) ) ) * vec3<f32>( 2.1 ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar110 = dot( normalView, positionViewDirection );
	nodeVar111 = textureSample( nodeUniform8, nodeUniform8_sampler, vec2<f32>( Roughness, clamp( nodeVar110, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar111;
	nodeVar112 = ( dfg.x + dfg.y );
	nodeVar113 = ( 1.0 / nodeVar112 );
	nodeVar114 = nodeVar113;
	nodeVar115 = ( nodeVar114 - 1.0 );
	nodeVar116 = ( SpecularColorBlended * vec3<f32>( nodeVar115 ) );
	nodeVar117 = ( nodeVar116 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar117;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar118 = dot( normalWorld, normalize( render.nodeUniform11 ) );
	nodeVar119 = ( nodeVar118 * 0.5 );
	nodeVar120 = ( nodeVar119 + 0.5 );
	nodeVar121 = mix( render.nodeUniform9, render.nodeUniform10, nodeVar120 );
	nodeVar122 = ( irradiance + nodeVar121 );
	irradiance = nodeVar122;
	nodeVar123 = ( render.nodeUniform12 - render.nodeUniform13 );
	nodeVar124 = vec4<f32>( nodeVar123, 0.0 );
	nodeVar125 = ( render.cameraViewMatrix * nodeVar124 );
	nodeVar126 = normalize( nodeVar125.xyz );
	nodeVar127 = nodeVar126;
	nodeVar128 = dot( normalView, nodeVar127 );
	nodeVar129 = ( vec3<f32>( clamp( nodeVar128, 0.0, 1.0 ) ) * render.nodeUniform14 );
	nodeVar130 = nodeVar129;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar131 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar132 = ( nodeVar130 * nodeVar131 );
	nodeVar133 = ( nodeVar127 + positionViewDirection );
	nodeVar134 = normalize( nodeVar133 );
	nodeVar135 = dot( positionViewDirection, nodeVar134 );
	nodeVar136 = clamp( nodeVar135, 0.0, 1.0 );
	nodeVar137 = exp2( ( ( ( nodeVar136 * -5.55473 ) - 6.98316 ) * nodeVar136 ) );
	nodeVar138 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar137 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar137 ) ) );
	nodeVar139 = ( vec3<f32>( 1.0 ) - nodeVar138 );
	nodeVar140 = nodeVar139;
	nodeVar141 = ( nodeVar132 * nodeVar140 );
	nodeVar142 = ( directDiffuse + nodeVar141 );
	directDiffuse = nodeVar142;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar143 = normalize( ( nodeVar127 + positionViewDirection ) );
	nodeVar144 = clamp( dot( positionViewDirection, nodeVar143 ), 0.0, 1.0 );
	nodeVar145 = exp2( ( ( ( nodeVar144 * -5.55473 ) - 6.98316 ) * nodeVar144 ) );
	nodeVar146 = ( Roughness * Roughness );
	nodeVar147 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar145 ) ) ) + vec3<f32>( ( 1.0 * nodeVar145 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar146, clamp( dot( normalView, nodeVar127 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar146, clamp( dot( normalView, nodeVar143 ), 0.0, 1.0 ) ) ) );
	nodeVar148 = ( nodeVar130 * nodeVar147 );
	nodeVar149 = ( nodeVar148 * multiScatteringCompensation );
	nodeVar150 = ( directSpecular + nodeVar149 );
	directSpecular = nodeVar150;
	nodeVar151 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar152 = vec4<f32>( nodeVar151, 0.0 );
	nodeVar153 = ( render.cameraViewMatrix * nodeVar152 );
	nodeVar154 = normalize( nodeVar153.xyz );
	nodeVar155 = nodeVar154;
	nodeVar156 = dot( normalView, nodeVar155 );
	shadowPositionWorld = v_positionWorld;
	nodeVar158 = ( render.nodeUniform18 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform19 ) ) ), 1.0 ) );
	nodeVar159 = ( nodeVar158.xyz / vec3<f32>( nodeVar158.w ) );
	nodeVar160 = vec3<f32>( nodeVar159.x, ( 1.0 - nodeVar159.y ), ( nodeVar159.z + render.nodeUniform20 ) );

	if ( ( ( ( ( ( nodeVar160.x >= 0.0 ) && ( nodeVar160.x <= 1.0 ) ) && ( nodeVar160.y >= 0.0 ) ) && ( nodeVar160.y <= 1.0 ) ) && ( nodeVar160.z <= 1.0 ) ) ) {

		nodeVar161 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar162 = ( render.nodeUniform22 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform23 ).x );
		nodeVar163 = ( nodeVar160.xy + ( vogelDiskSample( 0, 5, nodeVar161 ) * vec2<f32>( nodeVar162 ) ) );
		nodeVar164 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar163, nodeVar160.z );
		nodeVar165 = ( nodeVar160.xy + ( vogelDiskSample( 1, 5, nodeVar161 ) * vec2<f32>( nodeVar162 ) ) );
		nodeVar166 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar165, nodeVar160.z );
		nodeVar167 = ( nodeVar160.xy + ( vogelDiskSample( 2, 5, nodeVar161 ) * vec2<f32>( nodeVar162 ) ) );
		nodeVar168 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar167, nodeVar160.z );
		nodeVar169 = ( nodeVar160.xy + ( vogelDiskSample( 3, 5, nodeVar161 ) * vec2<f32>( nodeVar162 ) ) );
		nodeVar170 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar169, nodeVar160.z );
		nodeVar171 = ( nodeVar160.xy + ( vogelDiskSample( 4, 5, nodeVar161 ) * vec2<f32>( nodeVar162 ) ) );
		nodeVar172 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar171, nodeVar160.z );
		nodeVar157 = ( ( ( ( ( nodeVar164 + nodeVar166 ) + nodeVar168 ) + nodeVar170 ) + nodeVar172 ) * 0.2 );

	} else {

		nodeVar157 = 1.0;

	}

	nodeVar173 = mix( 1.0, nodeVar157, render.nodeUniform24 );
	nodeVar174 = ( vec3<f32>( clamp( nodeVar156, 0.0, 1.0 ) ) * ( render.nodeUniform17 * vec3<f32>( nodeVar173 ) ) );
	nodeVar175 = nodeVar174;
	nodeVar176 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar177 = ( nodeVar175 * nodeVar176 );
	nodeVar178 = ( nodeVar155 + positionViewDirection );
	nodeVar179 = normalize( nodeVar178 );
	nodeVar180 = dot( positionViewDirection, nodeVar179 );
	nodeVar181 = clamp( nodeVar180, 0.0, 1.0 );
	nodeVar182 = exp2( ( ( ( nodeVar181 * -5.55473 ) - 6.98316 ) * nodeVar181 ) );
	nodeVar183 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar182 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar182 ) ) );
	nodeVar184 = ( vec3<f32>( 1.0 ) - nodeVar183 );
	nodeVar185 = nodeVar184;
	nodeVar186 = ( nodeVar177 * nodeVar185 );
	nodeVar187 = ( directDiffuse + nodeVar186 );
	directDiffuse = nodeVar187;
	nodeVar188 = normalize( ( nodeVar155 + positionViewDirection ) );
	nodeVar189 = clamp( dot( positionViewDirection, nodeVar188 ), 0.0, 1.0 );
	nodeVar190 = exp2( ( ( ( nodeVar189 * -5.55473 ) - 6.98316 ) * nodeVar189 ) );
	nodeVar191 = ( Roughness * Roughness );
	nodeVar192 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar190 ) ) ) + vec3<f32>( ( 1.0 * nodeVar190 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar191, clamp( dot( normalView, nodeVar155 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar191, clamp( dot( normalView, nodeVar188 ), 0.0, 1.0 ) ) ) );
	nodeVar193 = ( nodeVar175 * nodeVar192 );
	nodeVar194 = ( nodeVar193 * multiScatteringCompensation );
	nodeVar195 = ( directSpecular + nodeVar194 );
	directSpecular = nodeVar195;
	nodeVar196 = ( render.nodeUniform25 - v_positionView );
	nodeVar197 = normalize( nodeVar196 );
	nodeVar198 = dot( normalView, nodeVar197 );

	if ( ( render.nodeUniform27 > 0.0 ) ) {

		nodeVar200 = length( nodeVar196 );
		nodeVar201 = ( nodeVar200 / render.nodeUniform27 );
		nodeVar202 = clamp( ( 1.0 - ( ( ( nodeVar201 * nodeVar201 ) * nodeVar201 ) * nodeVar201 ) ), 0.0, 1.0 );
		nodeVar199 = ( ( 1.0 / max( pow( nodeVar200, render.nodeUniform28 ), 0.01 ) ) * ( nodeVar202 * nodeVar202 ) );

	} else {

		nodeVar199 = ( 1.0 / max( pow( length( nodeVar196 ), render.nodeUniform28 ), 0.01 ) );

	}

	nodeVar203 = ( render.nodeUniform26 * vec3<f32>( nodeVar199 ) );
	nodeVar204 = ( vec3<f32>( clamp( nodeVar198, 0.0, 1.0 ) ) * nodeVar203 );
	nodeVar205 = nodeVar204;
	nodeVar206 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar207 = ( nodeVar205 * nodeVar206 );
	nodeVar208 = ( nodeVar197 + positionViewDirection );
	nodeVar209 = normalize( nodeVar208 );
	nodeVar210 = dot( positionViewDirection, nodeVar209 );
	nodeVar211 = clamp( nodeVar210, 0.0, 1.0 );
	nodeVar212 = exp2( ( ( ( nodeVar211 * -5.55473 ) - 6.98316 ) * nodeVar211 ) );
	nodeVar213 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar212 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar212 ) ) );
	nodeVar214 = ( vec3<f32>( 1.0 ) - nodeVar213 );
	nodeVar215 = nodeVar214;
	nodeVar216 = ( nodeVar207 * nodeVar215 );
	nodeVar217 = ( directDiffuse + nodeVar216 );
	directDiffuse = nodeVar217;
	nodeVar218 = normalize( ( nodeVar197 + positionViewDirection ) );
	nodeVar219 = clamp( dot( positionViewDirection, nodeVar218 ), 0.0, 1.0 );
	nodeVar220 = exp2( ( ( ( nodeVar219 * -5.55473 ) - 6.98316 ) * nodeVar219 ) );
	nodeVar221 = ( Roughness * Roughness );
	nodeVar222 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar220 ) ) ) + vec3<f32>( ( 1.0 * nodeVar220 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar221, clamp( dot( normalView, nodeVar197 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar221, clamp( dot( normalView, nodeVar218 ), 0.0, 1.0 ) ) ) );
	nodeVar223 = ( nodeVar205 * nodeVar222 );
	nodeVar224 = ( nodeVar223 * multiScatteringCompensation );
	nodeVar225 = ( directSpecular + nodeVar224 );
	directSpecular = nodeVar225;
	nodeVar226 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar227 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar228 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar229 = ( SpecularF90 * dfg.y );
	nodeVar230 = ( nodeVar228 + vec3<f32>( nodeVar229 ) );
	nodeVar231 = ( nodeVar226 + nodeVar230 );
	nodeVar226 = nodeVar231;
	nodeVar232 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar233 = nodeVar232;
	nodeVar234 = ( nodeVar233 * vec3<f32>( 0.047619 ) );
	nodeVar235 = ( SpecularColor + nodeVar234 );
	nodeVar236 = ( nodeVar230 * nodeVar235 );
	nodeVar237 = ( dfg.x + dfg.y );
	nodeVar238 = ( 1.0 - nodeVar237 );
	nodeVar239 = nodeVar238;
	nodeVar240 = ( vec3<f32>( nodeVar239 ) * nodeVar235 );
	nodeVar241 = ( vec3<f32>( 1.0 ) - nodeVar240 );
	nodeVar242 = nodeVar241;
	nodeVar243 = ( nodeVar236 / nodeVar242 );
	nodeVar244 = ( nodeVar243 * vec3<f32>( nodeVar239 ) );
	nodeVar245 = ( nodeVar227 + nodeVar244 );
	nodeVar227 = nodeVar245;
	nodeVar246 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar247 = ( irradiance * nodeVar246 );
	nodeVar248 = ( nodeVar226 + nodeVar227 );
	nodeVar249 = ( vec3<f32>( 1.0 ) - nodeVar248 );
	nodeVar250 = nodeVar249;
	nodeVar251 = ( nodeVar247 * nodeVar250 );
	nodeVar252 = nodeVar251;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar253 = ( indirectDiffuse + nodeVar252 );
	indirectDiffuse = nodeVar253;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar254 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar255 = ( SpecularF90 * dfg.y );
	nodeVar256 = ( nodeVar254 + vec3<f32>( nodeVar255 ) );
	nodeVar257 = ( singleScatteringDielectric + nodeVar256 );
	singleScatteringDielectric = nodeVar257;
	nodeVar258 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar259 = nodeVar258;
	nodeVar260 = ( nodeVar259 * vec3<f32>( 0.047619 ) );
	nodeVar261 = ( SpecularColor + nodeVar260 );
	nodeVar262 = ( nodeVar256 * nodeVar261 );
	nodeVar263 = ( dfg.x + dfg.y );
	nodeVar264 = ( 1.0 - nodeVar263 );
	nodeVar265 = nodeVar264;
	nodeVar266 = ( vec3<f32>( nodeVar265 ) * nodeVar261 );
	nodeVar267 = ( vec3<f32>( 1.0 ) - nodeVar266 );
	nodeVar268 = nodeVar267;
	nodeVar269 = ( nodeVar262 / nodeVar268 );
	nodeVar270 = ( nodeVar269 * vec3<f32>( nodeVar265 ) );
	nodeVar271 = ( multiScatteringDielectric + nodeVar270 );
	multiScatteringDielectric = nodeVar271;
	nodeVar272 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar273 = ( SpecularF90 * dfg.y );
	nodeVar274 = ( nodeVar272 + vec3<f32>( nodeVar273 ) );
	nodeVar275 = ( singleScatteringMetallic + nodeVar274 );
	singleScatteringMetallic = nodeVar275;
	nodeVar276 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar277 = nodeVar276;
	nodeVar278 = ( nodeVar277 * vec3<f32>( 0.047619 ) );
	nodeVar279 = ( DiffuseColor.xyz + nodeVar278 );
	nodeVar280 = ( nodeVar274 * nodeVar279 );
	nodeVar281 = ( dfg.x + dfg.y );
	nodeVar282 = ( 1.0 - nodeVar281 );
	nodeVar283 = nodeVar282;
	nodeVar284 = ( vec3<f32>( nodeVar283 ) * nodeVar279 );
	nodeVar285 = ( vec3<f32>( 1.0 ) - nodeVar284 );
	nodeVar286 = nodeVar285;
	nodeVar287 = ( nodeVar280 / nodeVar286 );
	nodeVar288 = ( nodeVar287 * vec3<f32>( nodeVar283 ) );
	nodeVar289 = ( multiScatteringMetallic + nodeVar288 );
	multiScatteringMetallic = nodeVar289;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar290 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar291 = ( radiance * nodeVar290 );
	nodeVar292 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar293 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar294 = ( nodeVar292 * nodeVar293 );
	nodeVar295 = ( nodeVar291 + nodeVar294 );
	nodeVar296 = nodeVar295;
	nodeVar297 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar298 = ( vec3<f32>( 1.0 ) - nodeVar297 );
	nodeVar299 = nodeVar298;
	nodeVar300 = ( DiffuseContribution * nodeVar299 );
	nodeVar301 = ( nodeVar300 * nodeVar293 );
	nodeVar302 = nodeVar301;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar303 = ( indirectSpecular + nodeVar296 );
	indirectSpecular = nodeVar303;
	nodeVar304 = ( indirectDiffuse + nodeVar302 );
	indirectDiffuse = nodeVar304;
	ambientOcclusion = 1.0;
	nodeVar305 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar305;
	nodeVar306 = dot( normalView, positionViewDirection );
	nodeVar307 = ( clamp( nodeVar306, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar308 = ( Roughness * -16.0 );
	nodeVar309 = ( 1.0 - nodeVar308 );
	nodeVar310 = nodeVar309;
	nodeVar311 = ( - nodeVar310 );
	nodeVar312 = exp2( nodeVar311 );
	nodeVar313 = pow( nodeVar307, nodeVar312 );
	nodeVar314 = ( 1.0 - nodeVar313 );
	nodeVar315 = nodeVar314;
	nodeVar316 = ( ambientOcclusion - nodeVar315 );
	nodeVar317 = ( indirectSpecular * vec3<f32>( clamp( nodeVar316, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar317;
	nodeVar318 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar318;
	nodeVar319 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar319;
	nodeVar320 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar320;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar321 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar322 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform29, object.nodeUniform30, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform32 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform33 * object.nodeUniform33 ) * nodeVar321 ) * nodeVar321 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar322;

	// result

	output.color = nodeVar322;

	return output;

}
