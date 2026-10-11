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
@binding( 3 ) @group( 1 ) var nodeUniform7_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform7 : texture_2d<f32>;
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
	nodeUniform6 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform9 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform8 : vec3<f32>,
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
var<private> nodeVar0 : vec2<f32>;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : u32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : vec3<f32>;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : vec2<f32>;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : vec3<f32>;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : vec2<f32>;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : vec2<f32>;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : u32;
var<private> nodeVar33 : u32;
var<private> nodeVar34 : u32;
var<private> nodeVar35 : u32;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : vec2<f32>;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : vec2<f32>;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : vec2<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec2<f32>;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : u32;
var<private> nodeVar60 : u32;
var<private> nodeVar61 : u32;
var<private> nodeVar62 : u32;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : f32;
var<private> Output : vec4<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar90 : vec3<f32>;
var<private> NORMAL_nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : vec2<f32>;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : f32;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec4<f32>;
var<private> nodeVar109 : vec4<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec4<f32>;
var<private> nodeVar137 : vec4<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : vec4<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : vec2<f32>;
var<private> nodeVar148 : f32;
var<private> nodeVar149 : vec2<f32>;
var<private> nodeVar150 : f32;
var<private> nodeVar151 : vec2<f32>;
var<private> nodeVar152 : f32;
var<private> nodeVar153 : vec2<f32>;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : vec2<f32>;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : f32;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : f32;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : f32;
var<private> nodeVar195 : f32;
var<private> nodeVar196 : f32;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : f32;
var<private> nodeVar205 : f32;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : f32;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : f32;
var<private> nodeVar222 : f32;
var<private> nodeVar223 : f32;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : f32;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : f32;
var<private> nodeVar248 : f32;
var<private> nodeVar249 : f32;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : f32;
var<private> nodeVar258 : vec3<f32>;
var<private> nodeVar259 : vec3<f32>;
var<private> nodeVar260 : vec3<f32>;
var<private> nodeVar261 : vec3<f32>;
var<private> nodeVar262 : vec3<f32>;
var<private> nodeVar263 : vec3<f32>;
var<private> nodeVar264 : vec3<f32>;
var<private> nodeVar265 : f32;
var<private> nodeVar266 : f32;
var<private> nodeVar267 : f32;
var<private> nodeVar268 : vec3<f32>;
var<private> nodeVar269 : vec3<f32>;
var<private> nodeVar270 : vec3<f32>;
var<private> nodeVar271 : vec3<f32>;
var<private> nodeVar272 : vec3<f32>;
var<private> nodeVar273 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar274 : vec3<f32>;
var<private> nodeVar275 : vec3<f32>;
var<private> nodeVar276 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar277 : vec3<f32>;
var<private> nodeVar278 : vec3<f32>;
var<private> nodeVar279 : vec3<f32>;
var<private> nodeVar280 : vec3<f32>;
var<private> nodeVar281 : vec3<f32>;
var<private> nodeVar282 : vec3<f32>;
var<private> nodeVar283 : vec3<f32>;
var<private> nodeVar284 : vec3<f32>;
var<private> nodeVar285 : vec3<f32>;
var<private> nodeVar286 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar287 : vec3<f32>;
var<private> nodeVar288 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar289 : vec3<f32>;
var<private> nodeVar290 : f32;
var<private> nodeVar291 : f32;
var<private> nodeVar292 : f32;
var<private> nodeVar293 : f32;
var<private> nodeVar294 : f32;
var<private> nodeVar295 : f32;
var<private> nodeVar296 : f32;
var<private> nodeVar297 : f32;
var<private> nodeVar298 : f32;
var<private> nodeVar299 : f32;
var<private> nodeVar300 : f32;
var<private> nodeVar301 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar302 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar303 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar304 : vec3<f32>;
var<private> nodeVar305 : f32;
var<private> nodeVar306 : vec4<f32>;

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
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 86.0 ) );
	nodeVar1 = length( nodeVar0 );
	nodeVar2 = ( nodeVar1 / 1.18 );
	nodeVar3 = floor( nodeVar2 );
	nodeVar4 = ( atan2( nodeVar0.y, nodeVar0.x ) / 6.283185307179586 );
	nodeVar5 = ( ( nodeVar3 + 0.5 ) * 1.18 );
	nodeVar6 = max( round( ( nodeVar5 * 3.9269908169872414 ) ), 6.0 );
	nodeVar7 = ( ( u32( ( nodeVar3 * 3.17 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = ( ( nodeVar4 * nodeVar6 ) + ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ) );
	nodeVar10 = ( ( u32( ( ( nodeVar3 * 53.1 ) + tsl_mod_float( floor( nodeVar9 ), nodeVar6 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar11 = ( ( ( nodeVar10 >> ( ( nodeVar10 >> 28u ) + 4u ) ) ^ nodeVar10 ) * 277803737u );
	nodeVar12 = ( f32( ( ( nodeVar11 >> 22u ) ^ nodeVar11 ) ) * 2.3283064365386963e-10 );
	nodeVar13 = fract( ( ( ( v_positionWorld * vec3<f32>( 2.4 ) ) + vec3<f32>( nodeVar12 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar14 = ( nodeVar13.z * 64.0 );
	nodeVar15 = floor( nodeVar14 );
	nodeVar16 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar15, 8.0 ), floor( ( nodeVar15 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar13.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar17 = length( vec2<f32>( ( v_positionWorld.x - 134.0 ), ( v_positionWorld.z - 86.0 ) ) );
	nodeVar18 = length( vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 98.0 ) ) );
	nodeVar19 = length( vec2<f32>( ( v_positionWorld.x - 110.0 ), ( v_positionWorld.z - 86.0 ) ) );
	nodeVar20 = length( vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 74.0 ) ) );
	nodeVar21 = fract( ( ( v_positionWorld * vec3<f32>( 0.33 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar22 = ( nodeVar21.z * 64.0 );
	nodeVar23 = floor( nodeVar22 );
	nodeVar24 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar23, 8.0 ), floor( ( nodeVar23 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar21.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar25 = ( max( max( ( smoothstep( 12.8, 16.0, nodeVar1 ) * 0.85 ), ( max( max( max( max( 0.0, ( 1.0 - smoothstep( 0.9, 2.4, nodeVar17 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar18 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar19 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar20 ) ) ) * 0.7 ) ), ( ( 1.0 - smoothstep( 1.6, 3.0, nodeVar1 ) ) * 0.5 ) ) * mix( 0.7, 1.25, ( ( mix( nodeVar24.x, nodeVar24.y, ( nodeVar22 - nodeVar23 ) ) * 0.5 ) + 0.5 ) ) );
	nodeVar26 = ( smoothstep( 0.0, 0.5, ( ( mix( nodeVar16.x, nodeVar16.y, ( nodeVar14 - nodeVar15 ) ) + ( nodeVar25 * 0.9 ) ) - 0.15 ) ) * nodeVar25 );
	nodeVar27 = fract( ( ( ( v_positionWorld * vec3<f32>( 0.16 ) ) + vec3<f32>( 2.2, 0.7, 6.1 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar28 = ( nodeVar27.z * 64.0 );
	nodeVar29 = floor( nodeVar28 );
	nodeVar30 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar29, 8.0 ), floor( ( nodeVar29 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar27.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar31 = ( ( ( ( ( ( 1.0 * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar17 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar18 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar19 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar20 ) ) * 0.42 ) ) ) * ( 1.0 - ( smoothstep( 14.6, 16.1, nodeVar1 ) * 0.48 ) ) ) * ( 1.0 - ( smoothstep( 0.34, 0.7, mix( nodeVar30.x, nodeVar30.y, ( nodeVar28 - nodeVar29 ) ) ) * 0.4 ) ) );
	nodeVar32 = ( ( u32( ( nodeVar12 + 17.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar33 = ( ( ( nodeVar32 >> ( ( nodeVar32 >> 28u ) + 4u ) ) ^ nodeVar32 ) * 277803737u );
	nodeVar34 = ( ( u32( nodeVar12 ) * 747796405u ) + 2891336453u );
	nodeVar35 = ( ( ( nodeVar34 >> ( ( nodeVar34 >> 28u ) + 4u ) ) ^ nodeVar34 ) * 277803737u );
	nodeVar36 = fract( ( ( ( v_positionWorld * vec3<f32>( 0.85 ) ) + vec3<f32>( ( nodeVar12 * 1.7 ) ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar37 = ( nodeVar36.z * 64.0 );
	nodeVar38 = floor( nodeVar37 );
	nodeVar39 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar38, 8.0 ), floor( ( nodeVar38 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar36.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar40 = ( ( mix( nodeVar39.x, nodeVar39.y, ( nodeVar37 - nodeVar38 ) ) * 0.5 ) + 0.5 );
	nodeVar41 = fract( nodeVar2 );
	nodeVar42 = fract( nodeVar9 );
	nodeVar43 = min( ( min( nodeVar41, ( 1.0 - nodeVar41 ) ) * 1.18 ), ( min( nodeVar42, ( 1.0 - nodeVar42 ) ) * ( ( nodeVar5 * 6.283185307179586 ) / nodeVar6 ) ) );
	nodeVar44 = fract( ( ( v_positionWorld * vec3<f32>( 9.5 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar45 = ( nodeVar44.z * 64.0 );
	nodeVar46 = floor( nodeVar45 );
	nodeVar47 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar46, 8.0 ), floor( ( nodeVar46 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar44.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar48 = ( ( nodeVar43 + ( mix( nodeVar47.x, nodeVar47.y, ( nodeVar45 - nodeVar46 ) ) * 0.014 ) ) + 0.0 );
	nodeVar49 = ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( ( nodeVar12 * 3.1 ) ) );
	nodeVar50 = fract( ( ( nodeVar49 * vec3<f32>( 2.9 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar51 = ( nodeVar50.z * 64.0 );
	nodeVar52 = floor( nodeVar51 );
	nodeVar53 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar52, 8.0 ), floor( ( nodeVar52 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar50.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar54 = fract( ( ( nodeVar49 + vec3<f32>( ( mix( nodeVar53.x, nodeVar53.y, ( nodeVar51 - nodeVar52 ) ) * 0.4 ) ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar55 = ( nodeVar54.z * 64.0 );
	nodeVar56 = floor( nodeVar55 );
	nodeVar57 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar56, 8.0 ), floor( ( nodeVar56 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar54.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar58 = abs( mix( nodeVar57.x, nodeVar57.y, ( nodeVar55 - nodeVar56 ) ) );
	nodeVar59 = ( ( u32( ( nodeVar12 + 3.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar60 = ( ( ( nodeVar59 >> ( ( nodeVar59 >> 28u ) + 4u ) ) ^ nodeVar59 ) * 277803737u );
	nodeVar61 = ( ( u32( ( nodeVar12 + 9.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar62 = ( ( ( nodeVar61 >> ( ( nodeVar61 >> 28u ) + 4u ) ) ^ nodeVar61 ) * 277803737u );
	nodeVar63 = ( 0.02 + ( ( f32( ( ( nodeVar62 >> 22u ) ^ nodeVar62 ) ) * 2.3283064365386963e-10 ) * 0.012 ) );
	nodeVar64 = ( fwidth( nodeVar43 ) + 0.0015 );
	nodeVar65 = smoothstep( ( nodeVar63 - ( nodeVar64 * 0.9 ) ), ( nodeVar63 + ( nodeVar64 * 0.9 ) ), nodeVar48 );
	nodeVar66 = max( ( ( ( 1.0 - smoothstep( 0.016, ( ( ( fwidth( nodeVar58 ) + 0.002 ) * 1.6 ) + 0.016 ), nodeVar58 ) ) * step( 0.725, ( f32( ( ( nodeVar60 >> 22u ) ^ nodeVar60 ) ) * 2.3283064365386963e-10 ) ) ) * nodeVar65 ), ( ( ( ( 1.0 - smoothstep( 0.012, ( 0.012 + ( ( fwidth( 1.0 ) + 0.0015 ) * 1.6 ) ), 1.0 ) ) * 0.55 ) * 0.0 ) * nodeVar65 ) );
	nodeVar67 = ( ( ( ( ( ( ( ( vec3<f32>( 0.215, 0.205, 0.192 ) * mix( vec3<f32>( 0.83, 0.92, 1.05 ), vec3<f32>( 1.07, 0.97, 0.8 ), ( f32( ( ( nodeVar33 >> 22u ) ^ nodeVar33 ) ) * 2.3283064365386963e-10 ) ) ) * vec3<f32>( ( 0.5 + ( ( f32( ( ( nodeVar35 >> 22u ) ^ nodeVar35 ) ) * 2.3283064365386963e-10 ) * 0.85 ) ) ) ) * vec3<f32>( mix( 0.74, 1.14, nodeVar40 ) ) ) * vec3<f32>( ( 1.0 + ( 0.0 * 0.15 ) ) ) ) * vec3<f32>( ( 1.0 - ( 0.0 * 0.3 ) ) ) ) * vec3<f32>( mix( 0.68, 1.0, smoothstep( 0.0, 0.17, nodeVar48 ) ) ) ) * vec3<f32>( ( 1.0 + ( ( smoothstep( 0.02, 0.05, nodeVar48 ) * ( 1.0 - smoothstep( 0.05, 0.11, nodeVar48 ) ) ) * 0.14 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar66 * 0.78 ) ) ) );
	nodeVar68 = mix( ( mix( vec3<f32>( 0.045, 0.041, 0.038 ), vec3<f32>( 0.07, 0.092, 0.04 ), ( nodeVar26 * 0.9 ) ) * vec3<f32>( nodeVar31 ) ), ( ( mix( nodeVar67, ( nodeVar67 * vec3<f32>( 0.62, 0.78, 0.5 ) ), ( nodeVar26 * 0.7 ) ) * vec3<f32>( ( 1.0 - ( nodeVar25 * 0.38 ) ) ) ) * vec3<f32>( nodeVar31 ) ), nodeVar65 );
	nodeVar69 = ( ( fwidth( nodeVar1 ) * 1.2 ) + 0.01 );
	nodeVar70 = mix( nodeVar68, ( nodeVar68 * vec3<f32>( 0.55 ) ), max( ( 1.0 - smoothstep( 0.07, ( 0.07 + nodeVar69 ), abs( ( nodeVar1 - 4.4 ) ) ) ), ( step( 0.84, fract( ( nodeVar4 * 36.0 ) ) ) * ( 1.0 - smoothstep( 0.16, ( nodeVar69 + 0.16 ), abs( ( nodeVar1 - 3.5 ) ) ) ) ) ) );
	DiffuseColor = vec4<f32>( nodeVar70, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform3;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar71 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 1.0, ( ( 0.93 - ( nodeVar40 * 0.1 ) ) + ( nodeVar26 * 0.07 ) ), nodeVar65 ), 0.0525 ) + max( max( nodeVar71.x, nodeVar71.y ), nodeVar71.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform3 ) ) );
	nodeVar72 = ( vec3<f32>( 115.88471875080587, 12.15, 71.23640507046963 ) - v_positionWorld );
	nodeVar73 = ( length( nodeVar72 ) / 4.4 );
	nodeVar74 = ( vec3<f32>( 128.11528124919414, 12.15, 71.23640507046964 ) - v_positionWorld );
	nodeVar75 = ( length( nodeVar74 ) / 4.4 );
	nodeVar76 = ( vec3<f32>( 136.76359492953037, 12.15, 79.88471875080587 ) - v_positionWorld );
	nodeVar77 = ( length( nodeVar76 ) / 4.4 );
	nodeVar78 = ( vec3<f32>( 136.76359492953037, 12.15, 92.11528124919414 ) - v_positionWorld );
	nodeVar79 = ( length( nodeVar78 ) / 4.4 );
	nodeVar80 = ( vec3<f32>( 128.11528124919414, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar81 = ( length( nodeVar80 ) / 4.4 );
	nodeVar82 = ( vec3<f32>( 115.88471875080586, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar83 = ( length( nodeVar82 ) / 4.4 );
	nodeVar84 = ( vec3<f32>( 107.23640507046963, 12.15, 92.11528124919413 ) - v_positionWorld );
	nodeVar85 = ( length( nodeVar84 ) / 4.4 );
	nodeVar86 = ( vec3<f32>( 107.23640507046963, 12.15, 79.88471875080586 ) - v_positionWorld );
	nodeVar87 = ( length( nodeVar86 ) / 4.4 );
	EmissiveColor = ( nodeVar70 * ( ( vec3<f32>( 1.0, 0.52, 0.2 ) * ( ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar73 * nodeVar73 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar72 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 0.0 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 0.0 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 0.0 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar75 * nodeVar75 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar74 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 2.399 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 4.0783 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 7.4369000000000005 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar77 * nodeVar77 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar76 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 4.798 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 8.1566 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 14.873800000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar79 * nodeVar79 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar78 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 7.197 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 12.2349 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 22.3107 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar81 * nodeVar81 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar80 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 9.596 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 16.3132 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 29.747600000000002 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar83 * nodeVar83 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar82 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 11.995000000000001 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 20.3915 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 37.18450000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar85 * nodeVar85 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar84 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 14.394 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 24.4698 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 44.6214 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar87 * nodeVar87 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar86 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 16.793 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 28.548099999999998 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 52.0583 ) ) * 0.03 ) ) ) ) ) ) * vec3<f32>( 2.1 ) ) );
	nodeVar88 = dpdx( v_positionView );
	nodeVar89 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar90 = cross( nodeVar89, NORMAL_normalView );
	NORMAL_nodeVar91 = dot( nodeVar88, NORMAL_nodeVar90 );
	nodeVar92 = ( ( ( ( ( nodeVar65 * 0.014 ) - ( 0.0 * 0.004 ) ) - ( nodeVar66 * 0.006 ) ) + ( 0.0 * 0.0018 ) ) + ( ( ( nodeVar40 - 0.5 ) * 2.0 ) * 0.004 ) );
	nodeVar93 = ( vec3<f32>( sign( NORMAL_nodeVar91 ) ) * ( ( ( vec3<f32>( dpdx( nodeVar92 ) ) * NORMAL_nodeVar90 ) + ( vec3<f32>( - dpdy( nodeVar92 ) ) * cross( NORMAL_normalView, nodeVar88 ) ) ) * vec3<f32>( 1.0 ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar91 ) ) * NORMAL_normalView ) - nodeVar93 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar94 = dot( normalView, positionViewDirection );
	nodeVar95 = textureSample( nodeUniform7, nodeUniform7_sampler, vec2<f32>( Roughness, clamp( nodeVar94, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar95;
	nodeVar96 = ( dfg.x + dfg.y );
	nodeVar97 = ( 1.0 / nodeVar96 );
	nodeVar98 = nodeVar97;
	nodeVar99 = ( nodeVar98 - 1.0 );
	nodeVar100 = ( SpecularColorBlended * vec3<f32>( nodeVar99 ) );
	nodeVar101 = ( nodeVar100 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar101;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar102 = dot( normalWorld, normalize( render.nodeUniform11 ) );
	nodeVar103 = ( nodeVar102 * 0.5 );
	nodeVar104 = ( nodeVar103 + 0.5 );
	nodeVar105 = mix( render.nodeUniform8, render.nodeUniform9, nodeVar104 );
	nodeVar106 = ( irradiance + nodeVar105 );
	irradiance = nodeVar106;
	nodeVar107 = ( render.nodeUniform12 - render.nodeUniform13 );
	nodeVar108 = vec4<f32>( nodeVar107, 0.0 );
	nodeVar109 = ( render.cameraViewMatrix * nodeVar108 );
	nodeVar110 = normalize( nodeVar109.xyz );
	nodeVar111 = nodeVar110;
	nodeVar112 = dot( normalView, nodeVar111 );
	nodeVar113 = ( vec3<f32>( clamp( nodeVar112, 0.0, 1.0 ) ) * render.nodeUniform14 );
	nodeVar114 = nodeVar113;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar115 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar116 = ( nodeVar114 * nodeVar115 );
	nodeVar117 = ( nodeVar111 + positionViewDirection );
	nodeVar118 = normalize( nodeVar117 );
	nodeVar119 = dot( positionViewDirection, nodeVar118 );
	nodeVar120 = clamp( nodeVar119, 0.0, 1.0 );
	nodeVar121 = exp2( ( ( ( nodeVar120 * -5.55473 ) - 6.98316 ) * nodeVar120 ) );
	nodeVar122 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar121 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar121 ) ) );
	nodeVar123 = ( vec3<f32>( 1.0 ) - nodeVar122 );
	nodeVar124 = nodeVar123;
	nodeVar125 = ( nodeVar116 * nodeVar124 );
	nodeVar126 = ( directDiffuse + nodeVar125 );
	directDiffuse = nodeVar126;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar127 = normalize( ( nodeVar111 + positionViewDirection ) );
	nodeVar128 = clamp( dot( positionViewDirection, nodeVar127 ), 0.0, 1.0 );
	nodeVar129 = exp2( ( ( ( nodeVar128 * -5.55473 ) - 6.98316 ) * nodeVar128 ) );
	nodeVar130 = ( Roughness * Roughness );
	nodeVar131 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar129 ) ) ) + vec3<f32>( ( 1.0 * nodeVar129 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar130, clamp( dot( normalView, nodeVar111 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar130, clamp( dot( normalView, nodeVar127 ), 0.0, 1.0 ) ) ) );
	nodeVar132 = ( nodeVar114 * nodeVar131 );
	nodeVar133 = ( nodeVar132 * multiScatteringCompensation );
	nodeVar134 = ( directSpecular + nodeVar133 );
	directSpecular = nodeVar134;
	nodeVar135 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar136 = vec4<f32>( nodeVar135, 0.0 );
	nodeVar137 = ( render.cameraViewMatrix * nodeVar136 );
	nodeVar138 = normalize( nodeVar137.xyz );
	nodeVar139 = nodeVar138;
	nodeVar140 = dot( normalView, nodeVar139 );
	shadowPositionWorld = v_positionWorld;
	nodeVar142 = ( render.nodeUniform18 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform19 ) ) ), 1.0 ) );
	nodeVar143 = ( nodeVar142.xyz / vec3<f32>( nodeVar142.w ) );
	nodeVar144 = vec3<f32>( nodeVar143.x, ( 1.0 - nodeVar143.y ), ( nodeVar143.z + render.nodeUniform20 ) );

	if ( ( ( ( ( ( nodeVar144.x >= 0.0 ) && ( nodeVar144.x <= 1.0 ) ) && ( nodeVar144.y >= 0.0 ) ) && ( nodeVar144.y <= 1.0 ) ) && ( nodeVar144.z <= 1.0 ) ) ) {

		nodeVar145 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar146 = ( render.nodeUniform22 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform23 ).x );
		nodeVar147 = ( nodeVar144.xy + ( vogelDiskSample( 0, 5, nodeVar145 ) * vec2<f32>( nodeVar146 ) ) );
		nodeVar148 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar147, nodeVar144.z );
		nodeVar149 = ( nodeVar144.xy + ( vogelDiskSample( 1, 5, nodeVar145 ) * vec2<f32>( nodeVar146 ) ) );
		nodeVar150 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar149, nodeVar144.z );
		nodeVar151 = ( nodeVar144.xy + ( vogelDiskSample( 2, 5, nodeVar145 ) * vec2<f32>( nodeVar146 ) ) );
		nodeVar152 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar151, nodeVar144.z );
		nodeVar153 = ( nodeVar144.xy + ( vogelDiskSample( 3, 5, nodeVar145 ) * vec2<f32>( nodeVar146 ) ) );
		nodeVar154 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar153, nodeVar144.z );
		nodeVar155 = ( nodeVar144.xy + ( vogelDiskSample( 4, 5, nodeVar145 ) * vec2<f32>( nodeVar146 ) ) );
		nodeVar156 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar155, nodeVar144.z );
		nodeVar141 = ( ( ( ( ( nodeVar148 + nodeVar150 ) + nodeVar152 ) + nodeVar154 ) + nodeVar156 ) * 0.2 );

	} else {

		nodeVar141 = 1.0;

	}

	nodeVar157 = mix( 1.0, nodeVar141, render.nodeUniform24 );
	nodeVar158 = ( vec3<f32>( clamp( nodeVar140, 0.0, 1.0 ) ) * ( render.nodeUniform17 * vec3<f32>( nodeVar157 ) ) );
	nodeVar159 = nodeVar158;
	nodeVar160 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar161 = ( nodeVar159 * nodeVar160 );
	nodeVar162 = ( nodeVar139 + positionViewDirection );
	nodeVar163 = normalize( nodeVar162 );
	nodeVar164 = dot( positionViewDirection, nodeVar163 );
	nodeVar165 = clamp( nodeVar164, 0.0, 1.0 );
	nodeVar166 = exp2( ( ( ( nodeVar165 * -5.55473 ) - 6.98316 ) * nodeVar165 ) );
	nodeVar167 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar166 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar166 ) ) );
	nodeVar168 = ( vec3<f32>( 1.0 ) - nodeVar167 );
	nodeVar169 = nodeVar168;
	nodeVar170 = ( nodeVar161 * nodeVar169 );
	nodeVar171 = ( directDiffuse + nodeVar170 );
	directDiffuse = nodeVar171;
	nodeVar172 = normalize( ( nodeVar139 + positionViewDirection ) );
	nodeVar173 = clamp( dot( positionViewDirection, nodeVar172 ), 0.0, 1.0 );
	nodeVar174 = exp2( ( ( ( nodeVar173 * -5.55473 ) - 6.98316 ) * nodeVar173 ) );
	nodeVar175 = ( Roughness * Roughness );
	nodeVar176 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar174 ) ) ) + vec3<f32>( ( 1.0 * nodeVar174 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar175, clamp( dot( normalView, nodeVar139 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar175, clamp( dot( normalView, nodeVar172 ), 0.0, 1.0 ) ) ) );
	nodeVar177 = ( nodeVar159 * nodeVar176 );
	nodeVar178 = ( nodeVar177 * multiScatteringCompensation );
	nodeVar179 = ( directSpecular + nodeVar178 );
	directSpecular = nodeVar179;
	nodeVar180 = ( render.nodeUniform25 - v_positionView );
	nodeVar181 = normalize( nodeVar180 );
	nodeVar182 = dot( normalView, nodeVar181 );

	if ( ( render.nodeUniform27 > 0.0 ) ) {

		nodeVar184 = length( nodeVar180 );
		nodeVar185 = ( nodeVar184 / render.nodeUniform27 );
		nodeVar186 = clamp( ( 1.0 - ( ( ( nodeVar185 * nodeVar185 ) * nodeVar185 ) * nodeVar185 ) ), 0.0, 1.0 );
		nodeVar183 = ( ( 1.0 / max( pow( nodeVar184, render.nodeUniform28 ), 0.01 ) ) * ( nodeVar186 * nodeVar186 ) );

	} else {

		nodeVar183 = ( 1.0 / max( pow( length( nodeVar180 ), render.nodeUniform28 ), 0.01 ) );

	}

	nodeVar187 = ( render.nodeUniform26 * vec3<f32>( nodeVar183 ) );
	nodeVar188 = ( vec3<f32>( clamp( nodeVar182, 0.0, 1.0 ) ) * nodeVar187 );
	nodeVar189 = nodeVar188;
	nodeVar190 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar191 = ( nodeVar189 * nodeVar190 );
	nodeVar192 = ( nodeVar181 + positionViewDirection );
	nodeVar193 = normalize( nodeVar192 );
	nodeVar194 = dot( positionViewDirection, nodeVar193 );
	nodeVar195 = clamp( nodeVar194, 0.0, 1.0 );
	nodeVar196 = exp2( ( ( ( nodeVar195 * -5.55473 ) - 6.98316 ) * nodeVar195 ) );
	nodeVar197 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar196 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar196 ) ) );
	nodeVar198 = ( vec3<f32>( 1.0 ) - nodeVar197 );
	nodeVar199 = nodeVar198;
	nodeVar200 = ( nodeVar191 * nodeVar199 );
	nodeVar201 = ( directDiffuse + nodeVar200 );
	directDiffuse = nodeVar201;
	nodeVar202 = normalize( ( nodeVar181 + positionViewDirection ) );
	nodeVar203 = clamp( dot( positionViewDirection, nodeVar202 ), 0.0, 1.0 );
	nodeVar204 = exp2( ( ( ( nodeVar203 * -5.55473 ) - 6.98316 ) * nodeVar203 ) );
	nodeVar205 = ( Roughness * Roughness );
	nodeVar206 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar204 ) ) ) + vec3<f32>( ( 1.0 * nodeVar204 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar205, clamp( dot( normalView, nodeVar181 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar205, clamp( dot( normalView, nodeVar202 ), 0.0, 1.0 ) ) ) );
	nodeVar207 = ( nodeVar189 * nodeVar206 );
	nodeVar208 = ( nodeVar207 * multiScatteringCompensation );
	nodeVar209 = ( directSpecular + nodeVar208 );
	directSpecular = nodeVar209;
	nodeVar210 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar211 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar212 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar213 = ( SpecularF90 * dfg.y );
	nodeVar214 = ( nodeVar212 + vec3<f32>( nodeVar213 ) );
	nodeVar215 = ( nodeVar210 + nodeVar214 );
	nodeVar210 = nodeVar215;
	nodeVar216 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar217 = nodeVar216;
	nodeVar218 = ( nodeVar217 * vec3<f32>( 0.047619 ) );
	nodeVar219 = ( SpecularColor + nodeVar218 );
	nodeVar220 = ( nodeVar214 * nodeVar219 );
	nodeVar221 = ( dfg.x + dfg.y );
	nodeVar222 = ( 1.0 - nodeVar221 );
	nodeVar223 = nodeVar222;
	nodeVar224 = ( vec3<f32>( nodeVar223 ) * nodeVar219 );
	nodeVar225 = ( vec3<f32>( 1.0 ) - nodeVar224 );
	nodeVar226 = nodeVar225;
	nodeVar227 = ( nodeVar220 / nodeVar226 );
	nodeVar228 = ( nodeVar227 * vec3<f32>( nodeVar223 ) );
	nodeVar229 = ( nodeVar211 + nodeVar228 );
	nodeVar211 = nodeVar229;
	nodeVar230 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar231 = ( irradiance * nodeVar230 );
	nodeVar232 = ( nodeVar210 + nodeVar211 );
	nodeVar233 = ( vec3<f32>( 1.0 ) - nodeVar232 );
	nodeVar234 = nodeVar233;
	nodeVar235 = ( nodeVar231 * nodeVar234 );
	nodeVar236 = nodeVar235;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar237 = ( indirectDiffuse + nodeVar236 );
	indirectDiffuse = nodeVar237;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar238 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar239 = ( SpecularF90 * dfg.y );
	nodeVar240 = ( nodeVar238 + vec3<f32>( nodeVar239 ) );
	nodeVar241 = ( singleScatteringDielectric + nodeVar240 );
	singleScatteringDielectric = nodeVar241;
	nodeVar242 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar243 = nodeVar242;
	nodeVar244 = ( nodeVar243 * vec3<f32>( 0.047619 ) );
	nodeVar245 = ( SpecularColor + nodeVar244 );
	nodeVar246 = ( nodeVar240 * nodeVar245 );
	nodeVar247 = ( dfg.x + dfg.y );
	nodeVar248 = ( 1.0 - nodeVar247 );
	nodeVar249 = nodeVar248;
	nodeVar250 = ( vec3<f32>( nodeVar249 ) * nodeVar245 );
	nodeVar251 = ( vec3<f32>( 1.0 ) - nodeVar250 );
	nodeVar252 = nodeVar251;
	nodeVar253 = ( nodeVar246 / nodeVar252 );
	nodeVar254 = ( nodeVar253 * vec3<f32>( nodeVar249 ) );
	nodeVar255 = ( multiScatteringDielectric + nodeVar254 );
	multiScatteringDielectric = nodeVar255;
	nodeVar256 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar257 = ( SpecularF90 * dfg.y );
	nodeVar258 = ( nodeVar256 + vec3<f32>( nodeVar257 ) );
	nodeVar259 = ( singleScatteringMetallic + nodeVar258 );
	singleScatteringMetallic = nodeVar259;
	nodeVar260 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar261 = nodeVar260;
	nodeVar262 = ( nodeVar261 * vec3<f32>( 0.047619 ) );
	nodeVar263 = ( DiffuseColor.xyz + nodeVar262 );
	nodeVar264 = ( nodeVar258 * nodeVar263 );
	nodeVar265 = ( dfg.x + dfg.y );
	nodeVar266 = ( 1.0 - nodeVar265 );
	nodeVar267 = nodeVar266;
	nodeVar268 = ( vec3<f32>( nodeVar267 ) * nodeVar263 );
	nodeVar269 = ( vec3<f32>( 1.0 ) - nodeVar268 );
	nodeVar270 = nodeVar269;
	nodeVar271 = ( nodeVar264 / nodeVar270 );
	nodeVar272 = ( nodeVar271 * vec3<f32>( nodeVar267 ) );
	nodeVar273 = ( multiScatteringMetallic + nodeVar272 );
	multiScatteringMetallic = nodeVar273;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar274 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar275 = ( radiance * nodeVar274 );
	nodeVar276 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar277 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar278 = ( nodeVar276 * nodeVar277 );
	nodeVar279 = ( nodeVar275 + nodeVar278 );
	nodeVar280 = nodeVar279;
	nodeVar281 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar282 = ( vec3<f32>( 1.0 ) - nodeVar281 );
	nodeVar283 = nodeVar282;
	nodeVar284 = ( DiffuseContribution * nodeVar283 );
	nodeVar285 = ( nodeVar284 * nodeVar277 );
	nodeVar286 = nodeVar285;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar287 = ( indirectSpecular + nodeVar280 );
	indirectSpecular = nodeVar287;
	nodeVar288 = ( indirectDiffuse + nodeVar286 );
	indirectDiffuse = nodeVar288;
	ambientOcclusion = 1.0;
	nodeVar289 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar289;
	nodeVar290 = dot( normalView, positionViewDirection );
	nodeVar291 = ( clamp( nodeVar290, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar292 = ( Roughness * -16.0 );
	nodeVar293 = ( 1.0 - nodeVar292 );
	nodeVar294 = nodeVar293;
	nodeVar295 = ( - nodeVar294 );
	nodeVar296 = exp2( nodeVar295 );
	nodeVar297 = pow( nodeVar291, nodeVar296 );
	nodeVar298 = ( 1.0 - nodeVar297 );
	nodeVar299 = nodeVar298;
	nodeVar300 = ( ambientOcclusion - nodeVar299 );
	nodeVar301 = ( indirectSpecular * vec3<f32>( clamp( nodeVar300, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar301;
	nodeVar302 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar302;
	nodeVar303 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar303;
	nodeVar304 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar304;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar305 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar306 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform29, object.nodeUniform30, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform32 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform33 * object.nodeUniform33 ) * nodeVar305 ) * nodeVar305 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar306;

	// result

	output.color = nodeVar306;

	return output;

}
