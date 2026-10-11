// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 2 ) @group( 1 ) var nodeUniform8_sampler : sampler;
@binding( 3 ) @group( 1 ) var nodeUniform8 : texture_2d<f32>;
@binding( 4 ) @group( 1 ) var nodeUniform21_sampler : sampler_comparison;
@binding( 5 ) @group( 1 ) var nodeUniform21 : texture_depth_2d;

struct NodeBuffer_9293Struct {
	value : array< vec4<f32>, 7 >
};
@binding( 1 ) @group( 1 )
var<uniform> NodeBuffer_9293 : NodeBuffer_9293Struct;

struct objectStruct {
	nodeUniform0 : f32,
	nodeUniform1 : f32,
	nodeUniform3 : mat3x3<f32>,
	nodeUniform5 : mat4x4<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : f32
};
@binding( 0 ) @group( 1 )
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
var<private> nodeVar1 : u32;
var<private> nodeVar2 : u32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : u32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : u32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : u32;
var<private> nodeVar20 : u32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar35 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar40 : vec3<f32>;
var<private> NORMAL_nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec2<f32>;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec4<f32>;
var<private> nodeVar71 : vec4<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec4<f32>;
var<private> nodeVar99 : vec4<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : vec4<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : vec2<f32>;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : vec2<f32>;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : vec2<f32>;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : vec2<f32>;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : vec2<f32>;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : f32;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
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
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : f32;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : f32;
var<private> nodeVar148 : f32;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : f32;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
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
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : f32;
var<private> nodeVar210 : f32;
var<private> nodeVar211 : f32;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : f32;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : f32;
var<private> nodeVar253 : f32;
var<private> nodeVar254 : f32;
var<private> nodeVar255 : f32;
var<private> nodeVar256 : f32;
var<private> nodeVar257 : f32;
var<private> nodeVar258 : f32;
var<private> nodeVar259 : f32;
var<private> nodeVar260 : f32;
var<private> nodeVar261 : f32;
var<private> nodeVar262 : f32;
var<private> nodeVar263 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar264 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar265 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar266 : vec3<f32>;
var<private> nodeVar267 : f32;
var<private> nodeVar268 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
fn mx_floor ( x : f32 ) -> i32 {

	var nodeVar0 : f32;

	nodeVar0 = x;

	return i32( floor( nodeVar0 ) );

}


fn mx_fade ( t : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = t;

	return ( ( ( nodeVar0 * nodeVar0 ) * nodeVar0 ) * ( ( nodeVar0 * ( ( nodeVar0 * 6.0 ) - 15.0 ) ) + 10.0 ) );

}


fn mx_rotl32 ( x : u32, k : i32 ) -> u32 {

	var nodeVar0 : i32;
	var nodeVar1 : u32;

	nodeVar0 = k;
	nodeVar1 = x;

	return ( ( nodeVar1 << u32( nodeVar0 ) ) | ( nodeVar1 >> u32( ( 32 - nodeVar0 ) ) ) );

}


fn mx_bjfinal ( a : u32, b : u32, c : u32 ) -> u32 {

	var nodeVar0 : u32;
	var nodeVar1 : u32;
	var nodeVar2 : u32;

	nodeVar0 = c;
	nodeVar1 = b;
	nodeVar2 = a;
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 14 ) );
	nodeVar2 = ( nodeVar2 ^ nodeVar0 );
	nodeVar2 = ( nodeVar2 - mx_rotl32( nodeVar0, 11 ) );
	nodeVar1 = ( nodeVar1 ^ nodeVar2 );
	nodeVar1 = ( nodeVar1 - mx_rotl32( nodeVar2, 25 ) );
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 16 ) );
	nodeVar2 = ( nodeVar2 ^ nodeVar0 );
	nodeVar2 = ( nodeVar2 - mx_rotl32( nodeVar0, 4 ) );
	nodeVar1 = ( nodeVar1 ^ nodeVar2 );
	nodeVar1 = ( nodeVar1 - mx_rotl32( nodeVar2, 14 ) );
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 24 ) );

	return nodeVar0;

}


fn mx_hash_int_2 ( x : i32, y : i32, z : i32 ) -> u32 {

	var nodeVar0 : i32;
	var nodeVar1 : i32;
	var nodeVar2 : i32;
	var nodeVar3 : u32;
	var nodeVar4 : u32;
	var nodeVar5 : u32;
	var nodeVar6 : u32;

	nodeVar0 = z;
	nodeVar1 = y;
	nodeVar2 = x;
	nodeVar3 = 3u;
	nodeVar4 = 0u;
	nodeVar5 = 0u;
	nodeVar6 = 0u;
	nodeVar6 = ( ( 3735928559u + ( nodeVar3 << 2u ) ) + 13u );
	nodeVar5 = nodeVar6;
	nodeVar4 = nodeVar5;
	nodeVar4 = ( nodeVar4 + u32( nodeVar2 ) );
	nodeVar5 = ( nodeVar5 + u32( nodeVar1 ) );
	nodeVar6 = ( nodeVar6 + u32( nodeVar0 ) );

	return mx_bjfinal( nodeVar4, nodeVar5, nodeVar6 );

}


fn mx_select ( b : bool, t : f32, f : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : bool;
	var nodeVar3 : f32;

	nodeVar0 = f;
	nodeVar1 = t;
	nodeVar2 = b;

	return select( nodeVar0, nodeVar1, nodeVar2 );

}


fn mx_negate_if ( val : f32, b : bool ) -> f32 {

	var nodeVar0 : bool;
	var nodeVar1 : f32;
	var nodeVar2 : f32;

	nodeVar0 = b;
	nodeVar1 = val;

	return select( nodeVar1, ( - nodeVar1 ), nodeVar0 );

}


fn mx_gradient_float_1 ( hash : u32, x : f32, y : f32, z : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : f32;
	var nodeVar3 : u32;
	var nodeVar4 : u32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;

	nodeVar0 = z;
	nodeVar1 = y;
	nodeVar2 = x;
	nodeVar3 = hash;
	nodeVar4 = ( nodeVar3 & 15u );
	nodeVar5 = mx_select( ( nodeVar4 < 8u ), nodeVar2, nodeVar1 );
	nodeVar6 = mx_select( ( nodeVar4 < 4u ), nodeVar1, mx_select( ( ( nodeVar4 == 12u ) || ( nodeVar4 == 14u ) ), nodeVar2, nodeVar0 ) );

	return ( mx_negate_if( nodeVar5, bool( ( nodeVar4 & 1u ) ) ) + mx_negate_if( nodeVar6, bool( ( nodeVar4 & 2u ) ) ) );

}


fn mx_trilerp_0 ( v0 : f32, v1 : f32, v2 : f32, v3 : f32, v4 : f32, v5 : f32, v6 : f32, v7 : f32, s : f32, t : f32, r : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : f32;
	var nodeVar3 : f32;
	var nodeVar4 : f32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;
	var nodeVar7 : f32;
	var nodeVar8 : f32;
	var nodeVar9 : f32;
	var nodeVar10 : f32;
	var nodeVar11 : f32;
	var nodeVar12 : f32;
	var nodeVar13 : f32;

	nodeVar0 = r;
	nodeVar1 = t;
	nodeVar2 = s;
	nodeVar3 = v7;
	nodeVar4 = v6;
	nodeVar5 = v5;
	nodeVar6 = v4;
	nodeVar7 = v3;
	nodeVar8 = v2;
	nodeVar9 = v1;
	nodeVar10 = v0;
	nodeVar11 = ( 1.0 - nodeVar2 );
	nodeVar12 = ( 1.0 - nodeVar1 );
	nodeVar13 = ( 1.0 - nodeVar0 );

	return ( ( nodeVar13 * ( ( nodeVar12 * ( ( nodeVar10 * nodeVar11 ) + ( nodeVar9 * nodeVar2 ) ) ) + ( nodeVar1 * ( ( nodeVar8 * nodeVar11 ) + ( nodeVar7 * nodeVar2 ) ) ) ) ) + ( nodeVar0 * ( ( nodeVar12 * ( ( nodeVar6 * nodeVar11 ) + ( nodeVar5 * nodeVar2 ) ) ) + ( nodeVar1 * ( ( nodeVar4 * nodeVar11 ) + ( nodeVar3 * nodeVar2 ) ) ) ) ) );

}


fn mx_gradient_scale3d_0 ( v : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = v;

	return ( 0.982 * nodeVar0 );

}


fn mx_perlin_noise_float_1 ( p : vec3<f32> ) -> f32 {

	var nodeVar0 : vec3<f32>;
	var nodeVar1 : i32;
	var nodeVar2 : i32;
	var nodeVar3 : i32;
	var nodeVar4 : f32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;
	var nodeVar7 : f32;
	var nodeVar8 : f32;
	var nodeVar9 : f32;
	var nodeVar10 : f32;
	var nodeVar11 : f32;
	var nodeVar12 : f32;
	var nodeVar13 : f32;

	nodeVar0 = p;
	nodeVar1 = 0;
	nodeVar2 = 0;
	nodeVar3 = 0;
	nodeVar4 = nodeVar0.x;
	nodeVar1 = mx_floor( nodeVar4 );
	nodeVar5 = ( nodeVar4 - f32( nodeVar1 ) );
	nodeVar6 = nodeVar0.y;
	nodeVar2 = mx_floor( nodeVar6 );
	nodeVar7 = ( nodeVar6 - f32( nodeVar2 ) );
	nodeVar8 = nodeVar0.z;
	nodeVar3 = mx_floor( nodeVar8 );
	nodeVar9 = ( nodeVar8 - f32( nodeVar3 ) );
	nodeVar10 = mx_fade( nodeVar5 );
	nodeVar11 = mx_fade( nodeVar7 );
	nodeVar12 = mx_fade( nodeVar9 );
	nodeVar13 = mx_trilerp_0( mx_gradient_float_1( mx_hash_int_2( nodeVar1, nodeVar2, nodeVar3 ), nodeVar5, nodeVar7, nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), nodeVar2, nodeVar3 ), ( nodeVar5 - 1.0 ), nodeVar7, nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, ( nodeVar2 + 1 ), nodeVar3 ), nodeVar5, ( nodeVar7 - 1.0 ), nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), ( nodeVar2 + 1 ), nodeVar3 ), ( nodeVar5 - 1.0 ), ( nodeVar7 - 1.0 ), nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, nodeVar2, ( nodeVar3 + 1 ) ), nodeVar5, nodeVar7, ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), nodeVar2, ( nodeVar3 + 1 ) ), ( nodeVar5 - 1.0 ), nodeVar7, ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, ( nodeVar2 + 1 ), ( nodeVar3 + 1 ) ), nodeVar5, ( nodeVar7 - 1.0 ), ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), ( nodeVar2 + 1 ), ( nodeVar3 + 1 ) ), ( nodeVar5 - 1.0 ), ( nodeVar7 - 1.0 ), ( nodeVar9 - 1.0 ) ), nodeVar10, nodeVar11, nodeVar12 );

	return mx_gradient_scale3d_0( nodeVar13 );

}


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
	@location( 1 ) v_normalViewGeometry : vec3<f32>,
	@location( 2 ) v_positionWorld : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec3<f32>,
	@location( 5 ) nodeVarying8 : vec2<f32>,
	@location( 6 ) nodeVarying9 : vec2<f32>,
	@location( 7 ) nodeVarying10 : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = floor( ( nodeVarying8.y / 0.72 ) );
	nodeVar1 = ( ( u32( ( nodeVar0 + 2.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar2 = ( ( ( nodeVar1 >> ( ( nodeVar1 >> 28u ) + 4u ) ) ^ nodeVar1 ) * 277803737u );
	nodeVar3 = ( ( ( f32( ( ( nodeVar2 >> 22u ) ^ nodeVar2 ) ) * 2.3283064365386963e-10 ) * 0.2 ) + 0.28 );
	nodeVar4 = ( nodeVarying8.y - ( nodeVar0 * 0.72 ) );
	nodeVar5 = step( nodeVar3, nodeVar4 );
	nodeVar6 = ( ( nodeVar0 * 2.0 ) + nodeVar5 );
	nodeVar7 = ( ( u32( ( nodeVar6 + 11.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = step( 0.5, nodeVarying9.y );
	nodeVar10 = mix( ( ( ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ) * 0.75 ) + 0.62 ), nodeVarying9.x, nodeVar9 );
	nodeVar11 = ( ( u32( ( nodeVar6 + 5.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar12 = ( ( ( nodeVar11 >> ( ( nodeVar11 >> 28u ) + 4u ) ) ^ nodeVar11 ) * 277803737u );
	nodeVar13 = ( ( nodeVarying8.x / nodeVar10 ) + ( ( tsl_mod_float( nodeVar6, 2.0 ) * 0.5 ) + floor( ( ( f32( ( ( nodeVar12 >> 22u ) ^ nodeVar12 ) ) * 2.3283064365386963e-10 ) * 8.0 ) ) ) );
	nodeVar14 = floor( nodeVar13 );
	nodeVar15 = ( mix( nodeVar14, tsl_mod_float( nodeVar14, max( nodeVarying9.y, 1.0 ) ), nodeVar9 ) + ( nodeVar6 * 57.3 ) );
	nodeVar16 = ( ( u32( ( nodeVar15 + 19.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar17 = ( ( ( nodeVar16 >> ( ( nodeVar16 >> 28u ) + 4u ) ) ^ nodeVar16 ) * 277803737u );
	nodeVar18 = ( ( f32( ( ( nodeVar17 >> 22u ) ^ nodeVar17 ) ) * 2.3283064365386963e-10 ) - 0.5 );
	nodeVar19 = ( ( u32( nodeVar15 ) * 747796405u ) + 2891336453u );
	nodeVar20 = ( ( ( nodeVar19 >> ( ( nodeVar19 >> 28u ) + 4u ) ) ^ nodeVar19 ) * 277803737u );
	nodeVar21 = ( ( ( f32( ( ( nodeVar20 >> 22u ) ^ nodeVar20 ) ) * 2.3283064365386963e-10 ) * 0.62 ) + 0.66 );
	nodeVar22 = vec3<f32>( ( nodeVarying8.x * 6.3 ), ( nodeVarying8.y * 6.3 ), ( nodeVar15 * 0.37 ) );
	nodeVar23 = ( ( mx_perlin_noise_float_1( nodeVar22 ) * 1.0 ) + 0.0 );
	nodeVar24 = smoothstep( 0.4, 0.7, ( ( mx_perlin_noise_float_1( ( nodeVar22 * vec3<f32>( 2.6 ) ) ) * 1.0 ) + 0.0 ) );
	nodeVar25 = ( ( mx_perlin_noise_float_1( vec3<f32>( ( nodeVarying8.x * 0.5 ), ( nodeVarying8.y * 0.45 ), 8.2 ) ) * 1.0 ) + 0.0 );
	nodeVar26 = fract( nodeVar13 );
	nodeVar27 = mix( nodeVar3, ( 0.72 - nodeVar3 ), nodeVar5 );
	nodeVar28 = ( ( nodeVar4 - ( nodeVar5 * nodeVar3 ) ) / nodeVar27 );
	nodeVar29 = ( min( ( min( nodeVar26, ( 1.0 - nodeVar26 ) ) * nodeVar10 ), ( min( nodeVar28, ( 1.0 - nodeVar28 ) ) * nodeVar27 ) ) + ( ( ( mx_perlin_noise_float_1( vec3<f32>( ( nodeVarying8.x * 7.1 ), ( nodeVarying8.y * 7.1 ), 1.7 ) ) * 1.0 ) + 0.0 ) * 0.011 ) );
	nodeVar30 = max( fwidth( nodeVarying8.x ), fwidth( nodeVarying8.y ) );
	nodeVar31 = ( ( nodeVar30 * 0.75 ) + 0.0015 );
	nodeVar32 = mix( ( 1.0 - smoothstep( ( 0.024 - nodeVar31 ), ( 0.024 + nodeVar31 ), nodeVar29 ) ), 0.17, smoothstep( 0.1, 0.34, nodeVar30 ) );
	nodeVar33 = smoothstep( 1.7, 0.0, ( ( nodeVarying10.z + ( nodeVar23 * 0.35 ) ) + ( nodeVar25 * 0.4 ) ) );
	nodeVar34 = mix( ( ( nodeVarying7 * vec3<f32>( ( 1.0 + ( nodeVar18 * 0.12 ) ), ( 1.0 - ( nodeVar18 * 0.02 ) ), ( 1.0 - ( nodeVar18 * 0.14 ) ) ) ) * vec3<f32>( max( ( ( ( ( ( ( ( ( ( ( nodeVar21 + ( nodeVar23 * 0.11 ) ) + 0.0 ) + ( nodeVar24 * 0.07 ) ) + ( ( ( mx_perlin_noise_float_1( vec3<f32>( ( nodeVarying8.x * 0.85 ), ( nodeVarying8.y * 0.16 ), 3.3 ) ) * 1.0 ) + 0.0 ) * 0.1 ) ) + ( nodeVar25 * 0.12 ) ) + ( smoothstep( 0.32, 0.0, ( min( nodeVarying10.x, nodeVarying10.y ) + ( nodeVar23 * 0.08 ) ) ) * 0.16 ) ) + ( ( smoothstep( 0.08, 0.035, nodeVar29 ) * ( 1.0 - nodeVar32 ) ) * 0.1 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar29 ) * 0.16 ) + 0.84 ) ) * ( 1.0 - ( nodeVar33 * 0.4 ) ) ) * ( 1.0 - ( nodeVar32 * 0.65 ) ) ), 0.0 ) ) ), ( vec3<f32>( 0.07, 0.09, 0.03 ) * vec3<f32>( nodeVar21 ) ), ( ( ( ( nodeVar33 * smoothstep( 0.0, 0.55, ( ( ( mx_perlin_noise_float_1( vec3<f32>( ( nodeVarying8.x * 2.4 ), ( nodeVarying8.y * 2.4 ), 9.1 ) ) * 1.0 ) + 0.0 ) + 0.15 ) ) ) * smoothstep( 1.1, 0.0, nodeVarying10.z ) ) * ( 1.0 - nodeVar32 ) ) * 0.6 ) );
	DiffuseColor = vec4<f32>( nodeVar34, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform0 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform1;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar35 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 0.93, 0.5, ( nodeVar33 * 0.75 ) ), 0.0525 ) + max( max( nodeVar35.x, nodeVar35.y ), nodeVar35.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform1 ) ) );
	nodeVar36 = ( NodeBuffer_9293.value[ 0u ].xyz - v_positionWorld );
	nodeVar37 = dot( nodeVar36, nodeVar36 );
	nodeVar38 = dpdx( v_positionView );
	nodeVar39 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar40 = cross( nodeVar39, NORMAL_normalView );
	NORMAL_nodeVar41 = dot( nodeVar38, NORMAL_nodeVar40 );
	nodeVar42 = ( ( ( ( ( smoothstep( 0.0, 0.07, nodeVar29 ) * 0.014 ) + ( smoothstep( 0.0, 0.02, nodeVar29 ) * 0.006 ) ) + ( ( ( mx_perlin_noise_float_1( vec3<f32>( ( nodeVarying8.x * 13.0 ), ( nodeVarying8.y * 13.0 ), nodeVar6 ) ) * 1.0 ) + 0.0 ) * 0.006 ) ) + ( nodeVar24 * -0.004 ) ) * ( 1.0 - smoothstep( 0.05, 0.22, nodeVar30 ) ) );
	nodeVar43 = ( vec3<f32>( sign( NORMAL_nodeVar41 ) ) * ( ( vec3<f32>( dpdx( nodeVar42 ) ) * NORMAL_nodeVar40 ) + ( vec3<f32>( - dpdy( nodeVar42 ) ) * cross( NORMAL_normalView, nodeVar38 ) ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar41 ) ) * NORMAL_normalView ) - nodeVar43 ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar44 = ( NodeBuffer_9293.value[ 1u ].xyz - v_positionWorld );
	nodeVar45 = dot( nodeVar44, nodeVar44 );
	nodeVar46 = ( NodeBuffer_9293.value[ 2u ].xyz - v_positionWorld );
	nodeVar47 = dot( nodeVar46, nodeVar46 );
	nodeVar48 = ( NodeBuffer_9293.value[ 3u ].xyz - v_positionWorld );
	nodeVar49 = dot( nodeVar48, nodeVar48 );
	nodeVar50 = ( NodeBuffer_9293.value[ 4u ].xyz - v_positionWorld );
	nodeVar51 = dot( nodeVar50, nodeVar50 );
	nodeVar52 = ( NodeBuffer_9293.value[ 5u ].xyz - v_positionWorld );
	nodeVar53 = dot( nodeVar52, nodeVar52 );
	nodeVar54 = ( NodeBuffer_9293.value[ 6u ].xyz - v_positionWorld );
	nodeVar55 = dot( nodeVar54, nodeVar54 );
	EmissiveColor = ( nodeVar34 * ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9293.value[ 0u ].w * ( 1.0 / ( 1.0 + ( nodeVar37 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar36 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar37 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform7 * 11.0 ) + 0.0 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform7 * 5.3 ) + ( 0.0 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9293.value[ 1u ].w * ( 1.0 / ( 1.0 + ( nodeVar45 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar44 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar45 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform7 * 11.0 ) + 2.13 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform7 * 5.3 ) + ( 2.13 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9293.value[ 2u ].w * ( 1.0 / ( 1.0 + ( nodeVar47 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar46 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar47 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform7 * 11.0 ) + 4.26 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform7 * 5.3 ) + ( 4.26 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9293.value[ 3u ].w * ( 1.0 / ( 1.0 + ( nodeVar49 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar48 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar49 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform7 * 11.0 ) + 6.39 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform7 * 5.3 ) + ( 6.39 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9293.value[ 4u ].w * ( 1.0 / ( 1.0 + ( nodeVar51 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar50 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar51 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform7 * 11.0 ) + 8.52 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform7 * 5.3 ) + ( 8.52 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9293.value[ 5u ].w * ( 1.0 / ( 1.0 + ( nodeVar53 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar52 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar53 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform7 * 11.0 ) + 10.649999999999999 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform7 * 5.3 ) + ( 10.649999999999999 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9293.value[ 6u ].w * ( 1.0 / ( 1.0 + ( nodeVar55 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar54 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar55 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform7 * 11.0 ) + 12.78 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform7 * 5.3 ) + ( 12.78 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar56 = dot( normalView, positionViewDirection );
	nodeVar57 = textureSample( nodeUniform8, nodeUniform8_sampler, vec2<f32>( Roughness, clamp( nodeVar56, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar57;
	nodeVar58 = ( dfg.x + dfg.y );
	nodeVar59 = ( 1.0 / nodeVar58 );
	nodeVar60 = nodeVar59;
	nodeVar61 = ( nodeVar60 - 1.0 );
	nodeVar62 = ( SpecularColorBlended * vec3<f32>( nodeVar61 ) );
	nodeVar63 = ( nodeVar62 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar63;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar64 = dot( normalWorld, normalize( render.nodeUniform11 ) );
	nodeVar65 = ( nodeVar64 * 0.5 );
	nodeVar66 = ( nodeVar65 + 0.5 );
	nodeVar67 = mix( render.nodeUniform9, render.nodeUniform10, nodeVar66 );
	nodeVar68 = ( irradiance + nodeVar67 );
	irradiance = nodeVar68;
	nodeVar69 = ( render.nodeUniform12 - render.nodeUniform13 );
	nodeVar70 = vec4<f32>( nodeVar69, 0.0 );
	nodeVar71 = ( render.cameraViewMatrix * nodeVar70 );
	nodeVar72 = normalize( nodeVar71.xyz );
	nodeVar73 = nodeVar72;
	nodeVar74 = dot( normalView, nodeVar73 );
	nodeVar75 = ( vec3<f32>( clamp( nodeVar74, 0.0, 1.0 ) ) * render.nodeUniform14 );
	nodeVar76 = nodeVar75;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar77 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar78 = ( nodeVar76 * nodeVar77 );
	nodeVar79 = ( nodeVar73 + positionViewDirection );
	nodeVar80 = normalize( nodeVar79 );
	nodeVar81 = dot( positionViewDirection, nodeVar80 );
	nodeVar82 = clamp( nodeVar81, 0.0, 1.0 );
	nodeVar83 = exp2( ( ( ( nodeVar82 * -5.55473 ) - 6.98316 ) * nodeVar82 ) );
	nodeVar84 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar83 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar83 ) ) );
	nodeVar85 = ( vec3<f32>( 1.0 ) - nodeVar84 );
	nodeVar86 = nodeVar85;
	nodeVar87 = ( nodeVar78 * nodeVar86 );
	nodeVar88 = ( directDiffuse + nodeVar87 );
	directDiffuse = nodeVar88;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar89 = normalize( ( nodeVar73 + positionViewDirection ) );
	nodeVar90 = clamp( dot( positionViewDirection, nodeVar89 ), 0.0, 1.0 );
	nodeVar91 = exp2( ( ( ( nodeVar90 * -5.55473 ) - 6.98316 ) * nodeVar90 ) );
	nodeVar92 = ( Roughness * Roughness );
	nodeVar93 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar91 ) ) ) + vec3<f32>( ( 1.0 * nodeVar91 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar92, clamp( dot( normalView, nodeVar73 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar92, clamp( dot( normalView, nodeVar89 ), 0.0, 1.0 ) ) ) );
	nodeVar94 = ( nodeVar76 * nodeVar93 );
	nodeVar95 = ( nodeVar94 * multiScatteringCompensation );
	nodeVar96 = ( directSpecular + nodeVar95 );
	directSpecular = nodeVar96;
	nodeVar97 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar98 = vec4<f32>( nodeVar97, 0.0 );
	nodeVar99 = ( render.cameraViewMatrix * nodeVar98 );
	nodeVar100 = normalize( nodeVar99.xyz );
	nodeVar101 = nodeVar100;
	nodeVar102 = dot( normalView, nodeVar101 );
	shadowPositionWorld = v_positionWorld;
	nodeVar104 = ( render.nodeUniform18 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform19 ) ) ), 1.0 ) );
	nodeVar105 = ( nodeVar104.xyz / vec3<f32>( nodeVar104.w ) );
	nodeVar106 = vec3<f32>( nodeVar105.x, ( 1.0 - nodeVar105.y ), ( nodeVar105.z + render.nodeUniform20 ) );

	if ( ( ( ( ( ( nodeVar106.x >= 0.0 ) && ( nodeVar106.x <= 1.0 ) ) && ( nodeVar106.y >= 0.0 ) ) && ( nodeVar106.y <= 1.0 ) ) && ( nodeVar106.z <= 1.0 ) ) ) {

		nodeVar107 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar108 = ( render.nodeUniform22 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform23 ).x );
		nodeVar109 = ( nodeVar106.xy + ( vogelDiskSample( 0, 5, nodeVar107 ) * vec2<f32>( nodeVar108 ) ) );
		nodeVar110 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar109, nodeVar106.z );
		nodeVar111 = ( nodeVar106.xy + ( vogelDiskSample( 1, 5, nodeVar107 ) * vec2<f32>( nodeVar108 ) ) );
		nodeVar112 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar111, nodeVar106.z );
		nodeVar113 = ( nodeVar106.xy + ( vogelDiskSample( 2, 5, nodeVar107 ) * vec2<f32>( nodeVar108 ) ) );
		nodeVar114 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar113, nodeVar106.z );
		nodeVar115 = ( nodeVar106.xy + ( vogelDiskSample( 3, 5, nodeVar107 ) * vec2<f32>( nodeVar108 ) ) );
		nodeVar116 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar115, nodeVar106.z );
		nodeVar117 = ( nodeVar106.xy + ( vogelDiskSample( 4, 5, nodeVar107 ) * vec2<f32>( nodeVar108 ) ) );
		nodeVar118 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar117, nodeVar106.z );
		nodeVar103 = ( ( ( ( ( nodeVar110 + nodeVar112 ) + nodeVar114 ) + nodeVar116 ) + nodeVar118 ) * 0.2 );

	} else {

		nodeVar103 = 1.0;

	}

	nodeVar119 = mix( 1.0, nodeVar103, render.nodeUniform24 );
	nodeVar120 = ( vec3<f32>( clamp( nodeVar102, 0.0, 1.0 ) ) * ( render.nodeUniform17 * vec3<f32>( nodeVar119 ) ) );
	nodeVar121 = nodeVar120;
	nodeVar122 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar123 = ( nodeVar121 * nodeVar122 );
	nodeVar124 = ( nodeVar101 + positionViewDirection );
	nodeVar125 = normalize( nodeVar124 );
	nodeVar126 = dot( positionViewDirection, nodeVar125 );
	nodeVar127 = clamp( nodeVar126, 0.0, 1.0 );
	nodeVar128 = exp2( ( ( ( nodeVar127 * -5.55473 ) - 6.98316 ) * nodeVar127 ) );
	nodeVar129 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar128 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar128 ) ) );
	nodeVar130 = ( vec3<f32>( 1.0 ) - nodeVar129 );
	nodeVar131 = nodeVar130;
	nodeVar132 = ( nodeVar123 * nodeVar131 );
	nodeVar133 = ( directDiffuse + nodeVar132 );
	directDiffuse = nodeVar133;
	nodeVar134 = normalize( ( nodeVar101 + positionViewDirection ) );
	nodeVar135 = clamp( dot( positionViewDirection, nodeVar134 ), 0.0, 1.0 );
	nodeVar136 = exp2( ( ( ( nodeVar135 * -5.55473 ) - 6.98316 ) * nodeVar135 ) );
	nodeVar137 = ( Roughness * Roughness );
	nodeVar138 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar136 ) ) ) + vec3<f32>( ( 1.0 * nodeVar136 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar137, clamp( dot( normalView, nodeVar101 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar137, clamp( dot( normalView, nodeVar134 ), 0.0, 1.0 ) ) ) );
	nodeVar139 = ( nodeVar121 * nodeVar138 );
	nodeVar140 = ( nodeVar139 * multiScatteringCompensation );
	nodeVar141 = ( directSpecular + nodeVar140 );
	directSpecular = nodeVar141;
	nodeVar142 = ( render.nodeUniform25 - v_positionView );
	nodeVar143 = normalize( nodeVar142 );
	nodeVar144 = dot( normalView, nodeVar143 );

	if ( ( render.nodeUniform27 > 0.0 ) ) {

		nodeVar146 = length( nodeVar142 );
		nodeVar147 = ( nodeVar146 / render.nodeUniform27 );
		nodeVar148 = clamp( ( 1.0 - ( ( ( nodeVar147 * nodeVar147 ) * nodeVar147 ) * nodeVar147 ) ), 0.0, 1.0 );
		nodeVar145 = ( ( 1.0 / max( pow( nodeVar146, render.nodeUniform28 ), 0.01 ) ) * ( nodeVar148 * nodeVar148 ) );

	} else {

		nodeVar145 = ( 1.0 / max( pow( length( nodeVar142 ), render.nodeUniform28 ), 0.01 ) );

	}

	nodeVar149 = ( render.nodeUniform26 * vec3<f32>( nodeVar145 ) );
	nodeVar150 = ( vec3<f32>( clamp( nodeVar144, 0.0, 1.0 ) ) * nodeVar149 );
	nodeVar151 = nodeVar150;
	nodeVar152 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar153 = ( nodeVar151 * nodeVar152 );
	nodeVar154 = ( nodeVar143 + positionViewDirection );
	nodeVar155 = normalize( nodeVar154 );
	nodeVar156 = dot( positionViewDirection, nodeVar155 );
	nodeVar157 = clamp( nodeVar156, 0.0, 1.0 );
	nodeVar158 = exp2( ( ( ( nodeVar157 * -5.55473 ) - 6.98316 ) * nodeVar157 ) );
	nodeVar159 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar158 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar158 ) ) );
	nodeVar160 = ( vec3<f32>( 1.0 ) - nodeVar159 );
	nodeVar161 = nodeVar160;
	nodeVar162 = ( nodeVar153 * nodeVar161 );
	nodeVar163 = ( directDiffuse + nodeVar162 );
	directDiffuse = nodeVar163;
	nodeVar164 = normalize( ( nodeVar143 + positionViewDirection ) );
	nodeVar165 = clamp( dot( positionViewDirection, nodeVar164 ), 0.0, 1.0 );
	nodeVar166 = exp2( ( ( ( nodeVar165 * -5.55473 ) - 6.98316 ) * nodeVar165 ) );
	nodeVar167 = ( Roughness * Roughness );
	nodeVar168 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar166 ) ) ) + vec3<f32>( ( 1.0 * nodeVar166 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar167, clamp( dot( normalView, nodeVar143 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar167, clamp( dot( normalView, nodeVar164 ), 0.0, 1.0 ) ) ) );
	nodeVar169 = ( nodeVar151 * nodeVar168 );
	nodeVar170 = ( nodeVar169 * multiScatteringCompensation );
	nodeVar171 = ( directSpecular + nodeVar170 );
	directSpecular = nodeVar171;
	nodeVar172 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar173 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar174 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar175 = ( SpecularF90 * dfg.y );
	nodeVar176 = ( nodeVar174 + vec3<f32>( nodeVar175 ) );
	nodeVar177 = ( nodeVar172 + nodeVar176 );
	nodeVar172 = nodeVar177;
	nodeVar178 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar179 = nodeVar178;
	nodeVar180 = ( nodeVar179 * vec3<f32>( 0.047619 ) );
	nodeVar181 = ( SpecularColor + nodeVar180 );
	nodeVar182 = ( nodeVar176 * nodeVar181 );
	nodeVar183 = ( dfg.x + dfg.y );
	nodeVar184 = ( 1.0 - nodeVar183 );
	nodeVar185 = nodeVar184;
	nodeVar186 = ( vec3<f32>( nodeVar185 ) * nodeVar181 );
	nodeVar187 = ( vec3<f32>( 1.0 ) - nodeVar186 );
	nodeVar188 = nodeVar187;
	nodeVar189 = ( nodeVar182 / nodeVar188 );
	nodeVar190 = ( nodeVar189 * vec3<f32>( nodeVar185 ) );
	nodeVar191 = ( nodeVar173 + nodeVar190 );
	nodeVar173 = nodeVar191;
	nodeVar192 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar193 = ( irradiance * nodeVar192 );
	nodeVar194 = ( nodeVar172 + nodeVar173 );
	nodeVar195 = ( vec3<f32>( 1.0 ) - nodeVar194 );
	nodeVar196 = nodeVar195;
	nodeVar197 = ( nodeVar193 * nodeVar196 );
	nodeVar198 = nodeVar197;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar199 = ( indirectDiffuse + nodeVar198 );
	indirectDiffuse = nodeVar199;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar200 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar201 = ( SpecularF90 * dfg.y );
	nodeVar202 = ( nodeVar200 + vec3<f32>( nodeVar201 ) );
	nodeVar203 = ( singleScatteringDielectric + nodeVar202 );
	singleScatteringDielectric = nodeVar203;
	nodeVar204 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar205 = nodeVar204;
	nodeVar206 = ( nodeVar205 * vec3<f32>( 0.047619 ) );
	nodeVar207 = ( SpecularColor + nodeVar206 );
	nodeVar208 = ( nodeVar202 * nodeVar207 );
	nodeVar209 = ( dfg.x + dfg.y );
	nodeVar210 = ( 1.0 - nodeVar209 );
	nodeVar211 = nodeVar210;
	nodeVar212 = ( vec3<f32>( nodeVar211 ) * nodeVar207 );
	nodeVar213 = ( vec3<f32>( 1.0 ) - nodeVar212 );
	nodeVar214 = nodeVar213;
	nodeVar215 = ( nodeVar208 / nodeVar214 );
	nodeVar216 = ( nodeVar215 * vec3<f32>( nodeVar211 ) );
	nodeVar217 = ( multiScatteringDielectric + nodeVar216 );
	multiScatteringDielectric = nodeVar217;
	nodeVar218 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar219 = ( SpecularF90 * dfg.y );
	nodeVar220 = ( nodeVar218 + vec3<f32>( nodeVar219 ) );
	nodeVar221 = ( singleScatteringMetallic + nodeVar220 );
	singleScatteringMetallic = nodeVar221;
	nodeVar222 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar223 = nodeVar222;
	nodeVar224 = ( nodeVar223 * vec3<f32>( 0.047619 ) );
	nodeVar225 = ( DiffuseColor.xyz + nodeVar224 );
	nodeVar226 = ( nodeVar220 * nodeVar225 );
	nodeVar227 = ( dfg.x + dfg.y );
	nodeVar228 = ( 1.0 - nodeVar227 );
	nodeVar229 = nodeVar228;
	nodeVar230 = ( vec3<f32>( nodeVar229 ) * nodeVar225 );
	nodeVar231 = ( vec3<f32>( 1.0 ) - nodeVar230 );
	nodeVar232 = nodeVar231;
	nodeVar233 = ( nodeVar226 / nodeVar232 );
	nodeVar234 = ( nodeVar233 * vec3<f32>( nodeVar229 ) );
	nodeVar235 = ( multiScatteringMetallic + nodeVar234 );
	multiScatteringMetallic = nodeVar235;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar236 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar237 = ( radiance * nodeVar236 );
	nodeVar238 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar239 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar240 = ( nodeVar238 * nodeVar239 );
	nodeVar241 = ( nodeVar237 + nodeVar240 );
	nodeVar242 = nodeVar241;
	nodeVar243 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar244 = ( vec3<f32>( 1.0 ) - nodeVar243 );
	nodeVar245 = nodeVar244;
	nodeVar246 = ( DiffuseContribution * nodeVar245 );
	nodeVar247 = ( nodeVar246 * nodeVar239 );
	nodeVar248 = nodeVar247;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar249 = ( indirectSpecular + nodeVar242 );
	indirectSpecular = nodeVar249;
	nodeVar250 = ( indirectDiffuse + nodeVar248 );
	indirectDiffuse = nodeVar250;
	ambientOcclusion = 1.0;
	nodeVar251 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar251;
	nodeVar252 = dot( normalView, positionViewDirection );
	nodeVar253 = ( clamp( nodeVar252, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar254 = ( Roughness * -16.0 );
	nodeVar255 = ( 1.0 - nodeVar254 );
	nodeVar256 = nodeVar255;
	nodeVar257 = ( - nodeVar256 );
	nodeVar258 = exp2( nodeVar257 );
	nodeVar259 = pow( nodeVar253, nodeVar258 );
	nodeVar260 = ( 1.0 - nodeVar259 );
	nodeVar261 = nodeVar260;
	nodeVar262 = ( ambientOcclusion - nodeVar261 );
	nodeVar263 = ( indirectSpecular * vec3<f32>( clamp( nodeVar262, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar263;
	nodeVar264 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar264;
	nodeVar265 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar265;
	nodeVar266 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar266;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar267 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar268 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform29, object.nodeUniform30, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform32 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform33 * object.nodeUniform33 ) * nodeVar267 ) * nodeVar267 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar268;

	// result

	output.color = nodeVar268;

	return output;

}
