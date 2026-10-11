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
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : vec2<f32>;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec2<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : vec2<f32>;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : u32;
var<private> nodeVar51 : u32;
var<private> nodeVar52 : u32;
var<private> nodeVar53 : u32;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar65 : vec3<f32>;
var<private> NORMAL_nodeVar66 : f32;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : vec2<f32>;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : f32;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec4<f32>;
var<private> nodeVar98 : vec4<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : f32;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec4<f32>;
var<private> nodeVar126 : vec4<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : vec4<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : vec2<f32>;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : vec2<f32>;
var<private> nodeVar139 : f32;
var<private> nodeVar140 : vec2<f32>;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : vec2<f32>;
var<private> nodeVar143 : f32;
var<private> nodeVar144 : vec2<f32>;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : f32;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : f32;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : f32;
var<private> nodeVar163 : f32;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : f32;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : f32;
var<private> nodeVar193 : f32;
var<private> nodeVar194 : f32;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
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
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : f32;
var<private> nodeVar237 : f32;
var<private> nodeVar238 : f32;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : f32;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : f32;
var<private> nodeVar255 : f32;
var<private> nodeVar256 : f32;
var<private> nodeVar257 : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> nodeVar259 : vec3<f32>;
var<private> nodeVar260 : vec3<f32>;
var<private> nodeVar261 : vec3<f32>;
var<private> nodeVar262 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar263 : vec3<f32>;
var<private> nodeVar264 : vec3<f32>;
var<private> nodeVar265 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar266 : vec3<f32>;
var<private> nodeVar267 : vec3<f32>;
var<private> nodeVar268 : vec3<f32>;
var<private> nodeVar269 : vec3<f32>;
var<private> nodeVar270 : vec3<f32>;
var<private> nodeVar271 : vec3<f32>;
var<private> nodeVar272 : vec3<f32>;
var<private> nodeVar273 : vec3<f32>;
var<private> nodeVar274 : vec3<f32>;
var<private> nodeVar275 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar276 : vec3<f32>;
var<private> nodeVar277 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar278 : vec3<f32>;
var<private> nodeVar279 : f32;
var<private> nodeVar280 : f32;
var<private> nodeVar281 : f32;
var<private> nodeVar282 : f32;
var<private> nodeVar283 : f32;
var<private> nodeVar284 : f32;
var<private> nodeVar285 : f32;
var<private> nodeVar286 : f32;
var<private> nodeVar287 : f32;
var<private> nodeVar288 : f32;
var<private> nodeVar289 : f32;
var<private> nodeVar290 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar291 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar292 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar293 : vec3<f32>;
var<private> nodeVar294 : f32;
var<private> nodeVar295 : vec4<f32>;

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

	nodeVar0 = ( nodeVarying7 / 0.3 );
	nodeVar1 = floor( nodeVar0 );
	nodeVar2 = ( ( u32( ( ( nodeVar1 * 1.9 ) + 13.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar3 = ( ( ( nodeVar2 >> ( ( nodeVar2 >> 28u ) + 4u ) ) ^ nodeVar2 ) * 277803737u );
	nodeVar4 = ( ( u32( ( nodeVar1 + 5.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar5 = ( ( ( nodeVar4 >> ( ( nodeVar4 >> 28u ) + 4u ) ) ^ nodeVar4 ) * 277803737u );
	nodeVar6 = ( 1.5 * ( ( ( f32( ( ( nodeVar5 >> 22u ) ^ nodeVar5 ) ) * 2.3283064365386963e-10 ) * 0.5 ) + 0.78 ) );
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
	nodeVar20 = ( max( ( ( 1.0 - smoothstep( 0.1, 1.5, nodeVar15 ) ) * 0.95 ), ( ( ( mix( nodeVar19.x, nodeVar19.y, ( nodeVar17 - nodeVar18 ) ) * 0.5 ) + 0.5 ) * 0.38 ) ) * 0.8 );
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
	nodeVar32 = fract( nodeVar0 );
	nodeVar33 = fract( nodeVar7 );
	nodeVar34 = min( ( min( nodeVar32, ( 1.0 - nodeVar32 ) ) * 0.3 ), ( min( nodeVar33, ( 1.0 - nodeVar33 ) ) * nodeVar6 ) );
	nodeVar35 = fract( ( ( v_positionWorld * vec3<f32>( 9.5 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar36 = ( nodeVar35.z * 64.0 );
	nodeVar37 = floor( nodeVar36 );
	nodeVar38 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar37, 8.0 ), floor( ( nodeVar37 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar35.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar39 = ( ( nodeVar34 + ( mix( nodeVar38.x, nodeVar38.y, ( nodeVar36 - nodeVar37 ) ) * 0.014 ) ) + 0.0 );
	nodeVar40 = ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( ( nodeVar10 * 3.1 ) ) );
	nodeVar41 = fract( ( ( nodeVar40 * vec3<f32>( 2.9 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar42 = ( nodeVar41.z * 64.0 );
	nodeVar43 = floor( nodeVar42 );
	nodeVar44 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar43, 8.0 ), floor( ( nodeVar43 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar41.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar45 = fract( ( ( nodeVar40 + vec3<f32>( ( mix( nodeVar44.x, nodeVar44.y, ( nodeVar42 - nodeVar43 ) ) * 0.4 ) ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar46 = ( nodeVar45.z * 64.0 );
	nodeVar47 = floor( nodeVar46 );
	nodeVar48 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar47, 8.0 ), floor( ( nodeVar47 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar45.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar49 = abs( mix( nodeVar48.x, nodeVar48.y, ( nodeVar46 - nodeVar47 ) ) );
	nodeVar50 = ( ( u32( ( nodeVar10 + 3.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar51 = ( ( ( nodeVar50 >> ( ( nodeVar50 >> 28u ) + 4u ) ) ^ nodeVar50 ) * 277803737u );
	nodeVar52 = ( ( u32( ( nodeVar10 + 9.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar53 = ( ( ( nodeVar52 >> ( ( nodeVar52 >> 28u ) + 4u ) ) ^ nodeVar52 ) * 277803737u );
	nodeVar54 = ( 0.022 + ( ( f32( ( ( nodeVar53 >> 22u ) ^ nodeVar53 ) ) * 2.3283064365386963e-10 ) * 0.012 ) );
	nodeVar55 = ( fwidth( nodeVar34 ) + 0.0015 );
	nodeVar56 = smoothstep( ( nodeVar54 - ( nodeVar55 * 0.9 ) ), ( nodeVar54 + ( nodeVar55 * 0.9 ) ), nodeVar39 );
	nodeVar57 = max( ( ( ( 1.0 - smoothstep( 0.016, ( ( ( fwidth( nodeVar49 ) + 0.002 ) * 1.6 ) + 0.016 ), nodeVar49 ) ) * step( 0.7525, ( f32( ( ( nodeVar51 >> 22u ) ^ nodeVar51 ) ) * 2.3283064365386963e-10 ) ) ) * nodeVar56 ), ( ( ( ( 1.0 - smoothstep( 0.012, ( 0.012 + ( ( fwidth( 1.0 ) + 0.0015 ) * 1.6 ) ), 1.0 ) ) * 0.0 ) * 0.0 ) * nodeVar56 ) );
	nodeVar58 = ( ( ( ( ( ( ( ( vec3<f32>( 0.215, 0.205, 0.192 ) * mix( vec3<f32>( 0.83, 0.92, 1.05 ), vec3<f32>( 1.07, 0.97, 0.8 ), ( f32( ( ( nodeVar24 >> 22u ) ^ nodeVar24 ) ) * 2.3283064365386963e-10 ) ) ) * vec3<f32>( ( 0.5 + ( ( f32( ( ( nodeVar26 >> 22u ) ^ nodeVar26 ) ) * 2.3283064365386963e-10 ) * 0.85 ) ) ) ) * vec3<f32>( mix( 0.74, 1.14, nodeVar31 ) ) ) * vec3<f32>( ( 1.0 + ( 0.0 * 0.15 ) ) ) ) * vec3<f32>( ( 1.0 - ( 0.0 * 0.3 ) ) ) ) * vec3<f32>( mix( 0.68, 1.0, smoothstep( 0.0, 0.17, nodeVar39 ) ) ) ) * vec3<f32>( ( 1.0 + ( ( smoothstep( 0.02, 0.05, nodeVar39 ) * ( 1.0 - smoothstep( 0.05, 0.11, nodeVar39 ) ) ) * 0.14 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar57 * 0.78 ) ) ) );
	nodeVar59 = mix( ( mix( vec3<f32>( 0.045, 0.041, 0.038 ), vec3<f32>( 0.07, 0.092, 0.04 ), ( nodeVar21 * 0.9 ) ) * vec3<f32>( nodeVar22 ) ), ( ( mix( nodeVar58, ( nodeVar58 * vec3<f32>( 0.62, 0.78, 0.5 ) ), ( nodeVar21 * 0.7 ) ) * vec3<f32>( ( 1.0 - ( nodeVar20 * 0.38 ) ) ) ) * vec3<f32>( nodeVar22 ) ), nodeVar56 );
	DiffuseColor = vec4<f32>( nodeVar59, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform3;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar60 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 1.0, ( ( 0.93 - ( nodeVar31 * 0.1 ) ) + ( nodeVar21 * 0.07 ) ), nodeVar56 ), 0.0525 ) + max( max( nodeVar60.x, nodeVar60.y ), nodeVar60.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform3 ) ) );
	nodeVar61 = ( vec3<f32>( 115.88471875080587, 12.15, 71.23640507046963 ) - v_positionWorld );
	nodeVar62 = ( length( nodeVar61 ) / 4.4 );
	nodeVar63 = dpdx( v_positionView );
	nodeVar64 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar65 = cross( nodeVar64, NORMAL_normalView );
	NORMAL_nodeVar66 = dot( nodeVar63, NORMAL_nodeVar65 );
	nodeVar67 = ( ( ( ( ( nodeVar56 * 0.014 ) - ( 0.0 * 0.004 ) ) - ( nodeVar57 * 0.006 ) ) + ( 0.0 * 0.0018 ) ) + ( ( ( nodeVar31 - 0.5 ) * 2.0 ) * 0.004 ) );
	nodeVar68 = ( vec3<f32>( sign( NORMAL_nodeVar66 ) ) * ( ( ( vec3<f32>( dpdx( nodeVar67 ) ) * NORMAL_nodeVar65 ) + ( vec3<f32>( - dpdy( nodeVar67 ) ) * cross( NORMAL_normalView, nodeVar63 ) ) ) * vec3<f32>( 1.0 ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar66 ) ) * NORMAL_normalView ) - nodeVar68 ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar69 = ( vec3<f32>( 128.11528124919414, 12.15, 71.23640507046964 ) - v_positionWorld );
	nodeVar70 = ( length( nodeVar69 ) / 4.4 );
	nodeVar71 = ( vec3<f32>( 136.76359492953037, 12.15, 79.88471875080587 ) - v_positionWorld );
	nodeVar72 = ( length( nodeVar71 ) / 4.4 );
	nodeVar73 = ( vec3<f32>( 136.76359492953037, 12.15, 92.11528124919414 ) - v_positionWorld );
	nodeVar74 = ( length( nodeVar73 ) / 4.4 );
	nodeVar75 = ( vec3<f32>( 128.11528124919414, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar76 = ( length( nodeVar75 ) / 4.4 );
	nodeVar77 = ( vec3<f32>( 115.88471875080586, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar78 = ( length( nodeVar77 ) / 4.4 );
	nodeVar79 = ( vec3<f32>( 107.23640507046963, 12.15, 92.11528124919413 ) - v_positionWorld );
	nodeVar80 = ( length( nodeVar79 ) / 4.4 );
	nodeVar81 = ( vec3<f32>( 107.23640507046963, 12.15, 79.88471875080586 ) - v_positionWorld );
	nodeVar82 = ( length( nodeVar81 ) / 4.4 );
	EmissiveColor = ( nodeVar59 * ( ( vec3<f32>( 1.0, 0.52, 0.2 ) * ( ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar62 * nodeVar62 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar61 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 0.0 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 0.0 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 0.0 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar70 * nodeVar70 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar69 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 2.399 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 4.0783 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 7.4369000000000005 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar72 * nodeVar72 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar71 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 4.798 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 8.1566 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 14.873800000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar74 * nodeVar74 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar73 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 7.197 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 12.2349 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 22.3107 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar76 * nodeVar76 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar75 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 9.596 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 16.3132 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 29.747600000000002 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar78 * nodeVar78 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar77 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 11.995000000000001 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 20.3915 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 37.18450000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar80 * nodeVar80 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar79 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 14.394 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 24.4698 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 44.6214 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar82 * nodeVar82 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar81 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 16.793 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 28.548099999999998 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 52.0583 ) ) * 0.03 ) ) ) ) ) ) * vec3<f32>( 2.1 ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar83 = dot( normalView, positionViewDirection );
	nodeVar84 = textureSample( nodeUniform8, nodeUniform8_sampler, vec2<f32>( Roughness, clamp( nodeVar83, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar84;
	nodeVar85 = ( dfg.x + dfg.y );
	nodeVar86 = ( 1.0 / nodeVar85 );
	nodeVar87 = nodeVar86;
	nodeVar88 = ( nodeVar87 - 1.0 );
	nodeVar89 = ( SpecularColorBlended * vec3<f32>( nodeVar88 ) );
	nodeVar90 = ( nodeVar89 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar90;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar91 = dot( normalWorld, normalize( render.nodeUniform11 ) );
	nodeVar92 = ( nodeVar91 * 0.5 );
	nodeVar93 = ( nodeVar92 + 0.5 );
	nodeVar94 = mix( render.nodeUniform9, render.nodeUniform10, nodeVar93 );
	nodeVar95 = ( irradiance + nodeVar94 );
	irradiance = nodeVar95;
	nodeVar96 = ( render.nodeUniform12 - render.nodeUniform13 );
	nodeVar97 = vec4<f32>( nodeVar96, 0.0 );
	nodeVar98 = ( render.cameraViewMatrix * nodeVar97 );
	nodeVar99 = normalize( nodeVar98.xyz );
	nodeVar100 = nodeVar99;
	nodeVar101 = dot( normalView, nodeVar100 );
	nodeVar102 = ( vec3<f32>( clamp( nodeVar101, 0.0, 1.0 ) ) * render.nodeUniform14 );
	nodeVar103 = nodeVar102;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar104 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar105 = ( nodeVar103 * nodeVar104 );
	nodeVar106 = ( nodeVar100 + positionViewDirection );
	nodeVar107 = normalize( nodeVar106 );
	nodeVar108 = dot( positionViewDirection, nodeVar107 );
	nodeVar109 = clamp( nodeVar108, 0.0, 1.0 );
	nodeVar110 = exp2( ( ( ( nodeVar109 * -5.55473 ) - 6.98316 ) * nodeVar109 ) );
	nodeVar111 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar110 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar110 ) ) );
	nodeVar112 = ( vec3<f32>( 1.0 ) - nodeVar111 );
	nodeVar113 = nodeVar112;
	nodeVar114 = ( nodeVar105 * nodeVar113 );
	nodeVar115 = ( directDiffuse + nodeVar114 );
	directDiffuse = nodeVar115;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar116 = normalize( ( nodeVar100 + positionViewDirection ) );
	nodeVar117 = clamp( dot( positionViewDirection, nodeVar116 ), 0.0, 1.0 );
	nodeVar118 = exp2( ( ( ( nodeVar117 * -5.55473 ) - 6.98316 ) * nodeVar117 ) );
	nodeVar119 = ( Roughness * Roughness );
	nodeVar120 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar118 ) ) ) + vec3<f32>( ( 1.0 * nodeVar118 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar119, clamp( dot( normalView, nodeVar100 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar119, clamp( dot( normalView, nodeVar116 ), 0.0, 1.0 ) ) ) );
	nodeVar121 = ( nodeVar103 * nodeVar120 );
	nodeVar122 = ( nodeVar121 * multiScatteringCompensation );
	nodeVar123 = ( directSpecular + nodeVar122 );
	directSpecular = nodeVar123;
	nodeVar124 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar125 = vec4<f32>( nodeVar124, 0.0 );
	nodeVar126 = ( render.cameraViewMatrix * nodeVar125 );
	nodeVar127 = normalize( nodeVar126.xyz );
	nodeVar128 = nodeVar127;
	nodeVar129 = dot( normalView, nodeVar128 );
	shadowPositionWorld = v_positionWorld;
	nodeVar131 = ( render.nodeUniform18 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform19 ) ) ), 1.0 ) );
	nodeVar132 = ( nodeVar131.xyz / vec3<f32>( nodeVar131.w ) );
	nodeVar133 = vec3<f32>( nodeVar132.x, ( 1.0 - nodeVar132.y ), ( nodeVar132.z + render.nodeUniform20 ) );

	if ( ( ( ( ( ( nodeVar133.x >= 0.0 ) && ( nodeVar133.x <= 1.0 ) ) && ( nodeVar133.y >= 0.0 ) ) && ( nodeVar133.y <= 1.0 ) ) && ( nodeVar133.z <= 1.0 ) ) ) {

		nodeVar134 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar135 = ( render.nodeUniform22 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform23 ).x );
		nodeVar136 = ( nodeVar133.xy + ( vogelDiskSample( 0, 5, nodeVar134 ) * vec2<f32>( nodeVar135 ) ) );
		nodeVar137 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar136, nodeVar133.z );
		nodeVar138 = ( nodeVar133.xy + ( vogelDiskSample( 1, 5, nodeVar134 ) * vec2<f32>( nodeVar135 ) ) );
		nodeVar139 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar138, nodeVar133.z );
		nodeVar140 = ( nodeVar133.xy + ( vogelDiskSample( 2, 5, nodeVar134 ) * vec2<f32>( nodeVar135 ) ) );
		nodeVar141 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar140, nodeVar133.z );
		nodeVar142 = ( nodeVar133.xy + ( vogelDiskSample( 3, 5, nodeVar134 ) * vec2<f32>( nodeVar135 ) ) );
		nodeVar143 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar142, nodeVar133.z );
		nodeVar144 = ( nodeVar133.xy + ( vogelDiskSample( 4, 5, nodeVar134 ) * vec2<f32>( nodeVar135 ) ) );
		nodeVar145 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar144, nodeVar133.z );
		nodeVar130 = ( ( ( ( ( nodeVar137 + nodeVar139 ) + nodeVar141 ) + nodeVar143 ) + nodeVar145 ) * 0.2 );

	} else {

		nodeVar130 = 1.0;

	}

	nodeVar146 = mix( 1.0, nodeVar130, render.nodeUniform24 );
	nodeVar147 = ( vec3<f32>( clamp( nodeVar129, 0.0, 1.0 ) ) * ( render.nodeUniform17 * vec3<f32>( nodeVar146 ) ) );
	nodeVar148 = nodeVar147;
	nodeVar149 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar150 = ( nodeVar148 * nodeVar149 );
	nodeVar151 = ( nodeVar128 + positionViewDirection );
	nodeVar152 = normalize( nodeVar151 );
	nodeVar153 = dot( positionViewDirection, nodeVar152 );
	nodeVar154 = clamp( nodeVar153, 0.0, 1.0 );
	nodeVar155 = exp2( ( ( ( nodeVar154 * -5.55473 ) - 6.98316 ) * nodeVar154 ) );
	nodeVar156 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar155 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar155 ) ) );
	nodeVar157 = ( vec3<f32>( 1.0 ) - nodeVar156 );
	nodeVar158 = nodeVar157;
	nodeVar159 = ( nodeVar150 * nodeVar158 );
	nodeVar160 = ( directDiffuse + nodeVar159 );
	directDiffuse = nodeVar160;
	nodeVar161 = normalize( ( nodeVar128 + positionViewDirection ) );
	nodeVar162 = clamp( dot( positionViewDirection, nodeVar161 ), 0.0, 1.0 );
	nodeVar163 = exp2( ( ( ( nodeVar162 * -5.55473 ) - 6.98316 ) * nodeVar162 ) );
	nodeVar164 = ( Roughness * Roughness );
	nodeVar165 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar163 ) ) ) + vec3<f32>( ( 1.0 * nodeVar163 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar164, clamp( dot( normalView, nodeVar128 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar164, clamp( dot( normalView, nodeVar161 ), 0.0, 1.0 ) ) ) );
	nodeVar166 = ( nodeVar148 * nodeVar165 );
	nodeVar167 = ( nodeVar166 * multiScatteringCompensation );
	nodeVar168 = ( directSpecular + nodeVar167 );
	directSpecular = nodeVar168;
	nodeVar169 = ( render.nodeUniform25 - v_positionView );
	nodeVar170 = normalize( nodeVar169 );
	nodeVar171 = dot( normalView, nodeVar170 );

	if ( ( render.nodeUniform27 > 0.0 ) ) {

		nodeVar173 = length( nodeVar169 );
		nodeVar174 = ( nodeVar173 / render.nodeUniform27 );
		nodeVar175 = clamp( ( 1.0 - ( ( ( nodeVar174 * nodeVar174 ) * nodeVar174 ) * nodeVar174 ) ), 0.0, 1.0 );
		nodeVar172 = ( ( 1.0 / max( pow( nodeVar173, render.nodeUniform28 ), 0.01 ) ) * ( nodeVar175 * nodeVar175 ) );

	} else {

		nodeVar172 = ( 1.0 / max( pow( length( nodeVar169 ), render.nodeUniform28 ), 0.01 ) );

	}

	nodeVar176 = ( render.nodeUniform26 * vec3<f32>( nodeVar172 ) );
	nodeVar177 = ( vec3<f32>( clamp( nodeVar171, 0.0, 1.0 ) ) * nodeVar176 );
	nodeVar178 = nodeVar177;
	nodeVar179 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar180 = ( nodeVar178 * nodeVar179 );
	nodeVar181 = ( nodeVar170 + positionViewDirection );
	nodeVar182 = normalize( nodeVar181 );
	nodeVar183 = dot( positionViewDirection, nodeVar182 );
	nodeVar184 = clamp( nodeVar183, 0.0, 1.0 );
	nodeVar185 = exp2( ( ( ( nodeVar184 * -5.55473 ) - 6.98316 ) * nodeVar184 ) );
	nodeVar186 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar185 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar185 ) ) );
	nodeVar187 = ( vec3<f32>( 1.0 ) - nodeVar186 );
	nodeVar188 = nodeVar187;
	nodeVar189 = ( nodeVar180 * nodeVar188 );
	nodeVar190 = ( directDiffuse + nodeVar189 );
	directDiffuse = nodeVar190;
	nodeVar191 = normalize( ( nodeVar170 + positionViewDirection ) );
	nodeVar192 = clamp( dot( positionViewDirection, nodeVar191 ), 0.0, 1.0 );
	nodeVar193 = exp2( ( ( ( nodeVar192 * -5.55473 ) - 6.98316 ) * nodeVar192 ) );
	nodeVar194 = ( Roughness * Roughness );
	nodeVar195 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar193 ) ) ) + vec3<f32>( ( 1.0 * nodeVar193 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar194, clamp( dot( normalView, nodeVar170 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar194, clamp( dot( normalView, nodeVar191 ), 0.0, 1.0 ) ) ) );
	nodeVar196 = ( nodeVar178 * nodeVar195 );
	nodeVar197 = ( nodeVar196 * multiScatteringCompensation );
	nodeVar198 = ( directSpecular + nodeVar197 );
	directSpecular = nodeVar198;
	nodeVar199 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar200 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar201 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar202 = ( SpecularF90 * dfg.y );
	nodeVar203 = ( nodeVar201 + vec3<f32>( nodeVar202 ) );
	nodeVar204 = ( nodeVar199 + nodeVar203 );
	nodeVar199 = nodeVar204;
	nodeVar205 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar206 = nodeVar205;
	nodeVar207 = ( nodeVar206 * vec3<f32>( 0.047619 ) );
	nodeVar208 = ( SpecularColor + nodeVar207 );
	nodeVar209 = ( nodeVar203 * nodeVar208 );
	nodeVar210 = ( dfg.x + dfg.y );
	nodeVar211 = ( 1.0 - nodeVar210 );
	nodeVar212 = nodeVar211;
	nodeVar213 = ( vec3<f32>( nodeVar212 ) * nodeVar208 );
	nodeVar214 = ( vec3<f32>( 1.0 ) - nodeVar213 );
	nodeVar215 = nodeVar214;
	nodeVar216 = ( nodeVar209 / nodeVar215 );
	nodeVar217 = ( nodeVar216 * vec3<f32>( nodeVar212 ) );
	nodeVar218 = ( nodeVar200 + nodeVar217 );
	nodeVar200 = nodeVar218;
	nodeVar219 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar220 = ( irradiance * nodeVar219 );
	nodeVar221 = ( nodeVar199 + nodeVar200 );
	nodeVar222 = ( vec3<f32>( 1.0 ) - nodeVar221 );
	nodeVar223 = nodeVar222;
	nodeVar224 = ( nodeVar220 * nodeVar223 );
	nodeVar225 = nodeVar224;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar226 = ( indirectDiffuse + nodeVar225 );
	indirectDiffuse = nodeVar226;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar227 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar228 = ( SpecularF90 * dfg.y );
	nodeVar229 = ( nodeVar227 + vec3<f32>( nodeVar228 ) );
	nodeVar230 = ( singleScatteringDielectric + nodeVar229 );
	singleScatteringDielectric = nodeVar230;
	nodeVar231 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar232 = nodeVar231;
	nodeVar233 = ( nodeVar232 * vec3<f32>( 0.047619 ) );
	nodeVar234 = ( SpecularColor + nodeVar233 );
	nodeVar235 = ( nodeVar229 * nodeVar234 );
	nodeVar236 = ( dfg.x + dfg.y );
	nodeVar237 = ( 1.0 - nodeVar236 );
	nodeVar238 = nodeVar237;
	nodeVar239 = ( vec3<f32>( nodeVar238 ) * nodeVar234 );
	nodeVar240 = ( vec3<f32>( 1.0 ) - nodeVar239 );
	nodeVar241 = nodeVar240;
	nodeVar242 = ( nodeVar235 / nodeVar241 );
	nodeVar243 = ( nodeVar242 * vec3<f32>( nodeVar238 ) );
	nodeVar244 = ( multiScatteringDielectric + nodeVar243 );
	multiScatteringDielectric = nodeVar244;
	nodeVar245 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar246 = ( SpecularF90 * dfg.y );
	nodeVar247 = ( nodeVar245 + vec3<f32>( nodeVar246 ) );
	nodeVar248 = ( singleScatteringMetallic + nodeVar247 );
	singleScatteringMetallic = nodeVar248;
	nodeVar249 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar250 = nodeVar249;
	nodeVar251 = ( nodeVar250 * vec3<f32>( 0.047619 ) );
	nodeVar252 = ( DiffuseColor.xyz + nodeVar251 );
	nodeVar253 = ( nodeVar247 * nodeVar252 );
	nodeVar254 = ( dfg.x + dfg.y );
	nodeVar255 = ( 1.0 - nodeVar254 );
	nodeVar256 = nodeVar255;
	nodeVar257 = ( vec3<f32>( nodeVar256 ) * nodeVar252 );
	nodeVar258 = ( vec3<f32>( 1.0 ) - nodeVar257 );
	nodeVar259 = nodeVar258;
	nodeVar260 = ( nodeVar253 / nodeVar259 );
	nodeVar261 = ( nodeVar260 * vec3<f32>( nodeVar256 ) );
	nodeVar262 = ( multiScatteringMetallic + nodeVar261 );
	multiScatteringMetallic = nodeVar262;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar263 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar264 = ( radiance * nodeVar263 );
	nodeVar265 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar266 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar267 = ( nodeVar265 * nodeVar266 );
	nodeVar268 = ( nodeVar264 + nodeVar267 );
	nodeVar269 = nodeVar268;
	nodeVar270 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar271 = ( vec3<f32>( 1.0 ) - nodeVar270 );
	nodeVar272 = nodeVar271;
	nodeVar273 = ( DiffuseContribution * nodeVar272 );
	nodeVar274 = ( nodeVar273 * nodeVar266 );
	nodeVar275 = nodeVar274;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar276 = ( indirectSpecular + nodeVar269 );
	indirectSpecular = nodeVar276;
	nodeVar277 = ( indirectDiffuse + nodeVar275 );
	indirectDiffuse = nodeVar277;
	ambientOcclusion = 1.0;
	nodeVar278 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar278;
	nodeVar279 = dot( normalView, positionViewDirection );
	nodeVar280 = ( clamp( nodeVar279, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar281 = ( Roughness * -16.0 );
	nodeVar282 = ( 1.0 - nodeVar281 );
	nodeVar283 = nodeVar282;
	nodeVar284 = ( - nodeVar283 );
	nodeVar285 = exp2( nodeVar284 );
	nodeVar286 = pow( nodeVar280, nodeVar285 );
	nodeVar287 = ( 1.0 - nodeVar286 );
	nodeVar288 = nodeVar287;
	nodeVar289 = ( ambientOcclusion - nodeVar288 );
	nodeVar290 = ( indirectSpecular * vec3<f32>( clamp( nodeVar289, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar290;
	nodeVar291 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar291;
	nodeVar292 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar292;
	nodeVar293 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar293;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar294 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar295 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform29, object.nodeUniform30, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform32 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform33 * object.nodeUniform33 ) * nodeVar294 ) * nodeVar294 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar295;

	// result

	output.color = nodeVar295;

	return output;

}
